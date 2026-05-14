export const RESUME_CSS_TEMPLATE = `
/* Resume template ("rt") */
.resumeScope .rt {
  background: white;
  color: #000;
  width: 820px;
  max-width: 100%;
  margin: 0 auto;
  /* Match @media print .rt padding in resumeCssPrint.ts so fitter scrollHeight ≈ PDF. */
  padding: 18px 28px;
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
  font-family: 'Times New Roman', Times, serif;
  font-size: 11.5pt;
  line-height: 1.12;
}

.resumeScope .rt__header {
  text-align: center;
  margin-bottom: 8px;
}

.resumeScope .rt__name {
  font-weight: 700;
  font-size: 19pt;
  letter-spacing: 0;
}

.resumeScope .rt__contact {
  margin-top: 2px;
  font-size: 11.5pt;
  color: #000;
}

.resumeScope .rt__link {
  color: #0b57d0;
  text-decoration: none;
}

.resumeScope .rt__link:hover {
  text-decoration: underline;
}

.resumeScope .rt__section {
  margin-top: 8px;
}

.resumeScope .rt__sectionTitle {
  font-weight: 700;
  font-size: 11.5pt;
  letter-spacing: 0;
  color: #000;
  border-bottom: 1px solid #000;
  padding-bottom: 2px;
  margin-bottom: 6px;
}

.resumeScope .rt__item {
  margin-top: 6px;
}

.resumeScope .rt__itemTop {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  align-items: start;
}

.resumeScope .rt__itemTop--inList {
  margin-top: 1px;
}

.resumeScope .rt__itemHeader {
  font-weight: 700;
  font-size: 11.5pt;
}

.resumeScope .rt__mutedItalic {
  font-weight: 400;
  font-style: italic;
}

.resumeScope .rt__subline {
  margin-top: 1px;
  font-style: italic;
  font-size: 11.5pt;
}

.resumeScope .rt__itemDates {
  font-size: 11.5pt;
  color: #000;
  white-space: nowrap;
  text-align: right;
}

.resumeScope .rt__bullets {
  margin: 3px 0 0;
  padding-left: 18px;
  list-style: disc;
  list-style-position: outside;
  font-size: 11.5pt;
  color: #000;
}

.resumeScope .rt__bullets--tight li {
  margin-bottom: 2px;
}

.resumeScope .rt__bullets li {
  margin-bottom: 2px;
}

.resumeScope .rt__courses {
  margin-top: 6px;
  font-size: 11.5pt;
  color: #000;
}

.resumeScope .rt__label {
  font-weight: 700;
}

.resumeScope .rt__skillsRow {
  font-size: 11.5pt;
  margin-bottom: 2px;
}

.resumeScope .rt__skillsLabel {
  font-weight: 700;
  font-style: italic;
}
`

