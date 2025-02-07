import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string, search: string): SafeHtml {
    if (!search || !text) {
      return text;
    }

    const pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    const regex = new RegExp(pattern, 'gi');

    const result = text.replace(regex, match => 
      `<span class="bg-transparent text-blue-700 font-semibold">${match}</span>`
    );
    return this.sanitizer.bypassSecurityTrustHtml(result);
  }
}