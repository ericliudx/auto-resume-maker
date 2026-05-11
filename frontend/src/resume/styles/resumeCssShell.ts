export const RESUME_CSS_SHELL = `
.resumeScope .resumePane {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.resumeScope .resumePane__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}

.resumeScope .resumePane__title {
  font-family: var(--heading);
  font-weight: 600;
  color: var(--text-h);
  font-size: 13px;
}

.resumeScope .resumePane__hint {
  font-size: 12px;
  color: var(--text);
  margin-top: 4px;
}

.resumeScope .resumePane__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--social-bg);
  color: var(--text-h);
  text-decoration: none;
  font-size: 12px;
  line-height: 1;
}

.resumeScope .resumePane__button:hover {
  background: color-mix(in srgb, var(--social-bg) 70%, white);
}

.resumeScope .resumePane__body {
  display: block;
  min-height: 0;
  flex: 1;
}

@media (max-width: 980px) {
  .resumeScope .resumePane__body {
    display: block;
  }
}

.resumeScope .resumePane__error {
  margin: 10px 0 0;
  font-size: 12px;
  color: #b91c1c;
}

.resumeScope .resumeCanvas {
  background: #f6f7f8;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  overflow: auto;
  min-height: 0;
  margin-top: 12px;
}

.resumeScope .resumeCanvas__loading {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text);
  margin-bottom: 8px;
}
`

