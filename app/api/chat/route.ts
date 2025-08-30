import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',  // Using GPT-4 for best quality responses
      messages: [
        {
          role: 'system',
          content: `You are evergreenOS, an advanced AI business operations assistant. You help executives and teams with:
- Business analytics and metrics
- Financial analysis and planning  
- Customer insights and CRM
- Operations optimization
- Strategic decision making

Be professional, insightful, and data-driven. Provide clear, actionable responses.
Format key points with bullet points and bold important metrics.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content || 'I couldn\'t generate a response.';
    
    // Generate follow-up suggestions based on the topic
    const suggestions = generateSuggestions(message);

    return NextResponse.json({
      success: true,
      message: response,
      suggestions
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // If quota exceeded or API key issue, return a demo response
    if (error?.status === 429 || error?.status === 401) {
      const demoResponses: { [key: string]: string } = {
        default: `I understand you're asking about "${message}". While I'm currently in demo mode due to API limits, in the full version I would provide you with detailed analysis and insights based on your business data.

Here's what I would typically help you with:
• Real-time data analysis and reporting
• Business metrics and KPIs
• Operational insights and recommendations
• Automated workflows and task management

The full evergreenOS platform integrates with your existing tools and provides comprehensive business intelligence through natural language commands.`,
        
        burn: `Based on typical business metrics, your monthly burn rate analysis would include:

• **Current burn rate**: Calculated from your actual expenses
• **Runway analysis**: Months of operation remaining
• **Cost breakdown**: By department and category
• **Optimization opportunities**: Areas for cost reduction
• **Trend analysis**: Month-over-month changes

In the full version, this would be calculated from your real financial data.`,
        
        revenue: `Revenue analysis typically covers:

• **Total revenue**: Current period vs. previous periods
• **Revenue by segment**: Product, service, geography
• **Growth trends**: MoM and YoY comparisons
• **Customer analysis**: Top contributors and churn
• **Forecasting**: Projected revenue based on trends

The full platform would connect to your actual sales and financial systems for real-time insights.`,
        
        customer: `Customer insights would include:

• **Customer segments**: Demographics and behavior patterns
• **Lifetime value**: CLV calculations and trends
• **Acquisition costs**: CAC and payback periods
• **Retention metrics**: Churn rate and engagement
• **Growth opportunities**: Untapped segments and upsell potential

This would be powered by your actual CRM and sales data in production.`
      };
      
      // Choose appropriate demo response based on keywords
      let response = demoResponses.default;
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('burn') || lowerMessage.includes('expense')) {
        response = demoResponses.burn;
      } else if (lowerMessage.includes('revenue') || lowerMessage.includes('sales')) {
        response = demoResponses.revenue;
      } else if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
        response = demoResponses.customer;
      }
      
      return NextResponse.json({
        success: true,
        message: response,
        suggestions: generateSuggestions(message),
        demo: true
      });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process your request',
        message: 'I encountered an error processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
}

function generateSuggestions(input: string): string[] {
  const lowercaseInput = input.toLowerCase();
  
  if (lowercaseInput.includes('revenue') || lowercaseInput.includes('sales')) {
    return [
      'Compare to last quarter',
      'Show revenue by product',
      'Forecast next month',
      'Analyze growth trends'
    ];
  } else if (lowercaseInput.includes('customer')) {
    return [
      'Show customer segments',
      'Analyze churn rate',
      'Calculate lifetime value',
      'Find growth opportunities'
    ];
  } else if (lowercaseInput.includes('inventory') || lowercaseInput.includes('stock')) {
    return [
      'Show low stock items',
      'Optimize reorder points',
      'Forecast demand',
      'Analyze turnover rates'
    ];
  } else if (lowercaseInput.includes('team') || lowercaseInput.includes('employee')) {
    return [
      'Show productivity metrics',
      'Analyze performance',
      'Calculate utilization',
      'Review team goals'
    ];
  } else {
    return [
      'Tell me more',
      'Show related data',
      'Explain in detail',
      'What are the next steps?'
    ];
  }
}