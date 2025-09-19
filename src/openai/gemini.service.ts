import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import removeMd from 'remove-markdown';
@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Biến môi trường GEMINI_API_KEY chưa có giá trị');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateArticle(topic: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Hãy viết một bài viết chi tiết về chủ đề: ${topic}`;
    const result = await model.generateContent(prompt);
    const stripMarkdown = this.stripMarkdown(result.response.text());
    return stripMarkdown;
  }

  stripMarkdown(text: string): string {
    return removeMd(text, {
      listUnicodeChar: '-', // thay * thành -
      useImgAltText: false, // thêm dòng này để satisfy type
    }).trim();
  }
}
