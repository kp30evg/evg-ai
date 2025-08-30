import OpenAI from 'openai';
import { db, entities, commandHistory, type Company, type User } from '@/lib/db';
import { eq, and, or, ilike, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface CommandContext {
  companyId: string;
  userId: string;
  company: Company;
  user: User;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  executionTime?: number;
}

export class CommandProcessor {
  async process(input: string, context: CommandContext): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Generate a response using OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are evergreenOS, an AI assistant for business operations. 
            You help users with their business data, analytics, and operations.
            Keep responses concise and professional.
            Format numbers and data clearly.
            If you need to perform an action, describe what you would do.
            The user's company is ${context.company.name}.`
          },
          {
            role: 'user',
            content: input
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content || 'I couldn\'t generate a response.';
      
      // Log the command for future training
      await db.insert(commandHistory).values({
        companyId: context.companyId,
        userId: context.userId,
        input,
        result: { response },
        success: true,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        message: response,
        executionTime: Date.now() - startTime,
        suggestions: this.generateSuggestions(input),
      };
    } catch (error) {
      console.error('Command processing error:', error);
      
      // Log the failure
      await db.insert(commandHistory).values({
        companyId: context.companyId,
        userId: context.userId,
        input,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: false,
        message: 'I encountered an error processing your request. Please try again.',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private generateSuggestions(input: string): string[] {
    // Generate contextual follow-up suggestions
    const suggestions = [];
    
    if (input.toLowerCase().includes('revenue')) {
      suggestions.push('Compare to last quarter');
      suggestions.push('Show revenue by product');
      suggestions.push('Forecast next month');
    } else if (input.toLowerCase().includes('customer')) {
      suggestions.push('Show customer growth');
      suggestions.push('Analyze churn rate');
      suggestions.push('Top customer segments');
    } else if (input.toLowerCase().includes('burn')) {
      suggestions.push('Break down by department');
      suggestions.push('Compare to budget');
      suggestions.push('Project runway');
    } else {
      suggestions.push('Show key metrics');
      suggestions.push('What changed this week?');
      suggestions.push('Generate report');
    }
    
    return suggestions;
  }
}

export const commandProcessor = new CommandProcessor();