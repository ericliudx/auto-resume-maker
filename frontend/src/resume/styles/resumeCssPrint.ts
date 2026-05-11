export const RESUME_CSS_PRINT = `
/* Print-only route */
.resumeScope.printRoot {
  padding: 0;
  margin: 0;
}

.resumeScope .printError {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  color: #b91c1c;
  padding: 12px;
}

@media print {
  @page {
    size: letter;
    margin: 0.5in;
  }

  body {
    background: white !important;
  }

  .resumeScope .rt {
    box-shadow: none;
    border-radius: 0;
    width: auto;
    max-width: none;
    margin: 0;
    padding: 18px 28px;
  }
}
`

