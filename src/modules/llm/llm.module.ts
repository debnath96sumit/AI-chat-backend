import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { HuggingFaceProvider } from './providers/huggingFace.provider';

@Module({
  providers: [LLMService, GroqProvider, GeminiProvider, HuggingFaceProvider],
  exports: [LLMService],
})
export class LLMModule {}
