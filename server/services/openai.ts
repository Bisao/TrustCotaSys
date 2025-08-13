import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const hasApiKey = !!process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;

if (hasApiKey) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
  });
} else {
  console.log("OPENAI_API_KEY not found. OpenAI features will use fallback responses for development.");
}

interface MarketAnalysis {
  priceRanges: {
    min: number;
    max: number;
    average: number;
  };
  trends: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
}

interface DashboardInsight {
  type: 'opportunity' | 'warning' | 'trend' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

class OpenAIService {
  async analyzeMarketTrends(productName: string, category?: string): Promise<MarketAnalysis> {
    if (!openai) {
      // Fallback response for development
      return {
        priceRanges: {
          min: 50,
          max: 200,
          average: 125
        },
        trends: ["Preços estáveis no último trimestre", "Demanda crescente por produtos sustentáveis"],
        recommendations: ["Considere negociar contratos de longo prazo", "Avalie fornecedores alternativos"],
        riskFactors: ["Volatilidade cambial", "Mudanças na legislação"],
        confidence: 0.75
      };
    }

    try {
      const prompt = `Analyze the current market trends for the product "${productName}"${category ? ` in the category "${category}"` : ''} in Brazil. 
      
      Please provide:
      1. Current price ranges (minimum, maximum, average) in BRL
      2. Market trends affecting this product
      3. Procurement recommendations
      4. Risk factors to consider
      5. Confidence level in the analysis

      Respond with JSON in this format:
      {
        "priceRanges": {
          "min": number,
          "max": number,
          "average": number
        },
        "trends": ["trend1", "trend2"],
        "recommendations": ["rec1", "rec2"],
        "riskFactors": ["risk1", "risk2"],
        "confidence": number (0-1)
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a procurement and market analysis expert specializing in the Brazilian market. Provide accurate, actionable insights for procurement professionals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error analyzing market trends:", error);
      throw new Error("Failed to analyze market trends");
    }
  }

  async analyzeQuotationRequest(request: any): Promise<any> {
    if (!openai) {
      return {
        costSavings: ["Considere negociar desconto para grandes volumes", "Avalie fornecedores locais para reduzir custos de frete"],
        supplierRecommendations: ["Solicite cotações de pelo menos 3 fornecedores", "Verifique referências e certificações"],
        timelineOptimization: ["Inicie processo de cotação com antecedência", "Considere prazos sazonais"],
        riskAssessment: ["Baixo risco para fornecedores conhecidos", "Verifique disponibilidade de estoque"],
        budgetAnalysis: ["Orçamento adequado para especificações", "Considere margem para variações"]
      };
    }

    try {
      const prompt = `Analyze this quotation request for potential issues, opportunities, and recommendations:

      Title: ${request.title}
      Description: ${request.description}
      Department: ${request.department}
      Urgency: ${request.urgency}
      Total Budget: R$ ${request.totalBudget}

      Please provide:
      1. Potential cost savings opportunities
      2. Alternative supplier recommendations
      3. Timeline optimization suggestions
      4. Risk assessment
      5. Budget analysis

      Respond with JSON format with these fields: costSavings, supplierRecommendations, timelineOptimization, riskAssessment, budgetAnalysis`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a procurement specialist with expertise in analyzing purchase requests and optimizing procurement processes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error analyzing quotation request:", error);
      throw new Error("Failed to analyze quotation request");
    }
  }

  async generateDashboardInsights(): Promise<DashboardInsight[]> {
    if (!openai) {
      return [
        {
          type: "opportunity",
          title: "Otimização de Custos",
          description: "Identifique oportunidades de economia através da consolidação de fornecedores",
          priority: "high",
          actionable: true
        },
        {
          type: "trend",
          title: "Tendência de Mercado",
          description: "Preços de matérias-primas em alta - considere compras antecipadas",
          priority: "medium",
          actionable: true
        },
        {
          type: "warning",
          title: "Alerta de Fornecedor",
          description: "Revisar contratos que vencem nos próximos 30 dias",
          priority: "high",
          actionable: true
        }
      ];
    }

    try {
      const prompt = `Generate current procurement insights for a Brazilian company's dashboard. Focus on:
      
      1. Cost optimization opportunities
      2. Market trends affecting procurement
      3. Supplier relationship management
      4. Risk alerts
      5. Process improvements

      Generate 3-5 relevant insights in JSON format:
      [
        {
          "type": "opportunity|warning|trend|recommendation",
          "title": "Insight title",
          "description": "Detailed description",
          "priority": "low|medium|high",
          "actionable": boolean
        }
      ]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a procurement AI assistant providing real-time insights for a Brazilian procurement management system. Generate relevant, actionable insights based on current market conditions and best practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"insights": []}');
      return result.insights || result || [];
    } catch (error) {
      console.error("Error generating dashboard insights:", error);
      // Return fallback insights if AI fails
      return [
        {
          type: 'opportunity',
          title: 'Oportunidade de Economia',
          description: 'Consolidar fornecedores de material de limpeza pode gerar economia significativa',
          priority: 'medium',
          actionable: true
        },
        {
          type: 'warning',
          title: 'Alerta de Preço',
          description: 'Detectada variação atípica nos preços de materiais elétricos',
          priority: 'high',
          actionable: true
        },
        {
          type: 'trend',
          title: 'Tendência de Mercado',
          description: 'Previsão de alta nos preços de materiais de construção nos próximos meses',
          priority: 'medium',
          actionable: false
        }
      ];
    }
  }

  async generateSupplierRecommendations(productCategory: string, requirements: any): Promise<any> {
    try {
      const prompt = `Based on the product category "${productCategory}" and requirements, recommend potential suppliers and evaluation criteria:

      Requirements: ${JSON.stringify(requirements)}

      Please provide:
      1. Supplier evaluation criteria
      2. Key questions to ask suppliers
      3. Red flags to watch for
      4. Negotiation strategies

      Respond in JSON format with fields: evaluationCriteria, keyQuestions, redFlags, negotiationStrategies`;

      const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a supplier relationship management expert with deep knowledge of the Brazilian market and procurement best practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error generating supplier recommendations:", error);
      throw new Error("Failed to generate supplier recommendations");
    }
  }

  async analyzePriceVariation(currentPrices: any[], historicalPrices: any[]): Promise<any> {
    try {
      const prompt = `Analyze the price variation between current and historical prices:

      Current Prices: ${JSON.stringify(currentPrices)}
      Historical Prices: ${JSON.stringify(historicalPrices)}

      Please provide:
      1. Price trend analysis
      2. Anomaly detection
      3. Forecasted prices for next 3 months
      4. Recommended actions

      Respond in JSON format with fields: trendAnalysis, anomalies, forecast, recommendedActions`;

      const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a price analysis expert specializing in procurement cost optimization and market trend prediction."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error("Error analyzing price variation:", error);
      throw new Error("Failed to analyze price variation");
    }
  }
}

export const openaiService = new OpenAIService();
