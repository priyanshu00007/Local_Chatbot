# Local Models Chatbot App

A modern, local AI chatbot built with Next.js, React, and Ollama for handling conversations, file uploads (with text extraction from PDFs and documents), model selection, and streaming responses. Supports dark/light themes, aborting responses, and exporting chats.

It allows you to chat with local models downloaded using Ollama, running entirely on your machine without external servers. Unlike Gemini, which relies on remote APIs, this app provides privacy-focused, offline-capable AI interactions. You can chat with various options for now, such as Ollama models like Llama 3.2, DeepSeek R1 1.5B, SmolLM 135M, and many more that you can pull via Ollama.

## Features

- **Chat Interface**: Streamed responses from Ollama models with runtime metrics.
- **File Uploads**: Attach files (TXT, MD, JSON, CSV, PDF, images, etc.). Extracts text from PDFs and text-based files for context-aware responses.
- **Model Selection**: Choose from multiple Ollama models (Llama 3.2, DeepSeek, SmolLM) with descriptions.
- **Stop Button**: Abort ongoing responses mid-stream.
- **Theme Toggle**: Light/dark mode support.
- **Chat Management**: Clear chat history and export conversations as JSON.
- **Backend Integration**: API for processing prompts with file context using LangChain and Ollama.

## Prerequisites

- Node.js >= 18.x
- Ollama installed and running locally (download from [ollama.com](https://ollama.com)).
- Pull required models: `ollama pull llama3.2:latest`, `ollama pull deepseek-r1:1.5b`, `ollama pull smollm:135m`.

## Installation

1. **Clone the repository** (if applicable) or create a new Next.js project:
   ```
   npx create-next-app@latest my-chatbot
   cd my-chatbot
   ```

2. **Install dependencies**:
   ```
   npm install next react react-dom @radix-ui/react-icons lucide-react react-markdown pdfjs-dist @langchain/ollama formidable pdf-parse textract
   ```
   Or using Yarn:
   ```
   yarn add next react react-dom @radix-ui/react-icons lucide-react react-markdown pdfjs-dist @langchain/ollama formidable pdf-parse textract
   ```

3. **Copy PDF.js worker**:
   - Copy `node_modules/pdfjs-dist/build/pdf.worker.min.js` to your `public/` folder:
     ```
     cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
     ```

4. **Set up API routes**:
   - Create `src/app/api/chat/route.ts` with the provided backend code for handling chats and file processing.

5. **Update your main page**:
   - Replace `src/app/page.tsx` with the provided React component code.

6. **Run the app**:
   ```
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Start a conversation**:
   - Type a message in the input field and press Enter (or click Send).
   - Select a model from the dropdown below the input.

2. **Upload files**:
   - Click the paperclip icon to select files.
   - Supported: TXT, MD, JSON, CSV, PDF (text extracted automatically).
   - Files appear in attachments list; remove with X if needed.

3. **Stop a response**:
   - While loading, click the "Stop" button to abort the streaming response.

4. **Clear or Export**:
   - Use header buttons to clear the chat or export as JSON.

5. **Query with files**:
   - Upload a document, then ask questions like "Summarize this PDF" – the model uses extracted text as context.

## Configuration

- **Ollama Models**: Edit `MODELS` array in frontend and `AVAILABLE_MODELS` in backend to add/remove models.
- **API Endpoint**: The chat API is at `/api/chat`. Customize chunk size or extraction logic in `route.ts`.
- **File Extraction**: Backend uses `pdf-parse` for PDFs and `textract` for DOCX. Add more formats as needed.
- **Caching**: Responses are cached for 30 seconds to avoid duplicates (configurable in Cache class).

## Troubleshooting

- **DOMMatrix not defined**: Ensure PDF.js is only loaded client-side (use dynamic imports if needed).
- **Worker 404**: Verify `pdf.worker.min.js` is in `public/` and server is restarted.
- **Ollama errors**: Ensure Ollama is running locally (`ollama serve`) and models are pulled.
- **Stream closed errors**: Ensure AbortController is properly managed; avoid multiple enqueues after abort.

## Issue
After Uploading the pdf unable to perform operations on that particular docs will surely sort it out
## Dependencies

- Next.js: App framework
- React & React DOM: UI
- Lucide React: Icons
- React Markdown: Rendering responses
- pdfjs-dist: Client-side PDF extraction
- @langchain/ollama: LLM integration
- formidable, pdf-parse, textract: Backend file processing

## License

MIT License. Feel free to use and modify.

credit for logics by [KenanGain](https://github.com/KenanGain)
