import Anthropic from '@anthropic-ai/sdk';

interface AnalyzeRequest {
  symbol: string;
  price: number;
  change24h: number;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ma: { ma20: number; ma50: number; ma200: number };
    stochRsi: { k: number; d: number };
    bb: { upper: number; middle: number; lower: number };
    volume: { current: number; average: number; ratio: number };
  };
  support: number[];
  resistance: number[];
  mode: string;
}

interface AnalyzeResponse {
  analysis: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  targets: {
    entry: number;
    tp1: number;
    tp2: number;
    stopLoss: number;
  };
}

function generateMockAnalysis(data: AnalyzeRequest): AnalyzeResponse {
  const { price, change24h, indicators, support, resistance, mode } = data;
  const isBullish = change24h > 0 && indicators.rsi < 70 && indicators.macd.histogram > 0;
  const isBearish = change24h < 0 && indicators.rsi > 30 && indicators.macd.histogram < 0;

  const recommendation: 'buy' | 'sell' | 'hold' = isBullish ? 'buy' : isBearish ? 'sell' : 'hold';

  const modeMultiplier = mode === 'scalping' ? 0.02 : mode === 'intraday' ? 0.05 : 0.1;

  const entry = price;
  const tp1 = recommendation === 'sell'
    ? price * (1 - modeMultiplier)
    : price * (1 + modeMultiplier);
  const tp2 = recommendation === 'sell'
    ? price * (1 - modeMultiplier * 2)
    : price * (1 + modeMultiplier * 2);
  const stopLoss = recommendation === 'sell'
    ? price * (1 + modeMultiplier * 0.5)
    : price * (1 - modeMultiplier * 0.5);

  const rsiStatus = indicators.rsi < 30 ? 'oversold' : indicators.rsi > 70 ? 'overbought' : 'netral';
  const macdStatus = indicators.macd.histogram > 0 ? 'bullish' : 'bearish';
  const volumeStatus = indicators.volume.ratio > 1.5 ? 'tinggi' : indicators.volume.ratio < 0.5 ? 'rendah' : 'normal';

  const analysis = `**Analisis Teknikal ${data.symbol}** (Mode: ${mode})

RSI saat ini di ${indicators.rsi.toFixed(1)} (${rsiStatus}). MACD menunjukkan sinyal ${macdStatus} dengan histogram ${indicators.macd.histogram > 0 ? 'positif' : 'negatif'}. Volume perdagangan ${volumeStatus} (rasio: ${indicators.volume.ratio.toFixed(1)}x).

Harga berada ${price > indicators.ma.ma20 ? 'di atas' : 'di bawah'} MA20 (${indicators.ma.ma20.toFixed(2)}) dan ${price > indicators.ma.ma50 ? 'di atas' : 'di bawah'} MA50 (${indicators.ma.ma50.toFixed(2)}).

Support terdekat: $${support[0]?.toLocaleString() ?? '-'}. Resistance terdekat: $${resistance[0]?.toLocaleString() ?? '-'}.

**Rekomendasi: ${recommendation === 'buy' ? 'BELI' : recommendation === 'sell' ? 'JUAL' : 'TAHAN'}** dengan tingkat keyakinan sedang. Pastikan selalu menggunakan manajemen risiko yang tepat.`;

  return {
    analysis,
    recommendation,
    confidence: isBullish || isBearish ? 72 : 50,
    targets: { entry, tp1, tp2, stopLoss },
  };
}

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { symbol, price, change24h, indicators, support, resistance, mode } = body;

    if (!symbol || price == null || !indicators) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock analysis when no API key is configured
      const mock = generateMockAnalysis(body);
      return Response.json(mock);
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `Kamu adalah analis teknikal crypto profesional. Berikan analisis dalam Bahasa Indonesia yang ringkas dan actionable. Fokus pada data teknikal yang diberikan. Selalu berikan rekomendasi (buy/sell/hold), confidence level (0-100), dan target harga (entry, tp1, tp2, stopLoss). Format response sebagai JSON valid.`;

    const userPrompt = `Analisis teknikal untuk ${symbol} (Mode: ${mode}):

Harga: $${price.toLocaleString()} (${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}% 24h)

Indikator:
- RSI: ${indicators.rsi.toFixed(1)}
- MACD: value=${indicators.macd.value.toFixed(4)}, signal=${indicators.macd.signal.toFixed(4)}, histogram=${indicators.macd.histogram.toFixed(4)}
- MA20: $${indicators.ma.ma20.toFixed(2)}, MA50: $${indicators.ma.ma50.toFixed(2)}, MA200: $${indicators.ma.ma200.toFixed(2)}
- Stoch RSI: K=${indicators.stochRsi.k.toFixed(1)}, D=${indicators.stochRsi.d.toFixed(1)}
- Bollinger Bands: Upper=$${indicators.bb.upper.toFixed(2)}, Middle=$${indicators.bb.middle.toFixed(2)}, Lower=$${indicators.bb.lower.toFixed(2)}
- Volume Ratio: ${indicators.volume.ratio.toFixed(1)}x

Support: ${support.map((s) => `$${s.toLocaleString()}`).join(', ')}
Resistance: ${resistance.map((r) => `$${r.toLocaleString()}`).join(', ')}

Berikan response dalam format JSON:
{
  "analysis": "string - analisis lengkap dalam Bahasa Indonesia (2-3 paragraf)",
  "recommendation": "buy" | "sell" | "hold",
  "confidence": number (0-100),
  "targets": {
    "entry": number,
    "tp1": number,
    "tp2": number,
    "stopLoss": number
  }
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = textBlock.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr) as AnalyzeResponse;

    // Validate required fields
    if (!result.analysis || !result.recommendation || !result.targets) {
      throw new Error('Invalid AI response structure');
    }

    return Response.json(result);
  } catch (error) {
    console.error('Analyze API error:', error);
    try {
      const mock = generateMockAnalysis(body);
      return Response.json(mock);
    } catch {
      return Response.json({ error: 'Failed to analyze' }, { status: 500 });
    }
  }
}
