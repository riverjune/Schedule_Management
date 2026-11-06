import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: true });

export const renderMarkdown = (src: string) =>
  DOMPurify.sanitize(marked.parse(src, { async: false }) as string);
