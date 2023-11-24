'use client';
import styles from "../styles/page.module.css"
import { useState } from 'react'
import { errors } from '../lib/common_errors'
type LineWithHighlight = {
  highlightedLine: JSX.Element;
  lineNumber: number;
};
export default function Home() {
  const [sbFile, setSbFile] = useState<File>()
  const [sbOutput, setSbOutput] = useState<LineWithHighlight[]>([]);


  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!sbFile) return alert('Sb Log is required')

    const fileReader = new FileReader();


    fileReader.onload = (event) => {
      const fileContent = event.target?.result;
      if (typeof fileContent === 'string') {
        const lines = fileContent.split(/\r\n|\n/); // split text file based on new lines and form array of strings
        const searchStrings = errors // predefined errors to search for
    
        const matchedLines = lines.reduce<LineWithHighlight[]>((acc, line, index) => {
          if (searchStrings.some(str => line.includes(str))) {
            const highlightedLine = highlightText(line, searchStrings);
            acc.push({ highlightedLine, lineNumber: index + 1 });
          }
          return acc;
        }, []);
    
        setSbOutput(matchedLines);
      } else {
        alert('Error reading file content');
      }
    };

    fileReader.onerror = function() {
        alert('Error reading file');
    };

    fileReader.readAsText(sbFile);

  }

  function highlightText(line: any, searchStrings: any) {
    const regex = new RegExp(`(${searchStrings.join('|')})`, 'gi');
    const parts = line.split(regex);
  
    return parts.map((part: any, index: number) => regex.test(part) ? 
      <span key={index} className={styles['highlight']}>{part}</span> : 
      part
    );
  }
  

  return (
    <main className={styles.main}>
      <div className={styles["input-container"]}>
        <form
          onSubmit={onSubmit}
          id="input-form"
          className={styles["input-form"]}
        >
          <div>
            <label htmlFor="sbLog">Upload SB log</label>
            <input
              onChange={(e) => setSbFile(e.target.files?.[0])}
              id="sbLog"
              type="file"
            />
          </div>
          <div>
            <label htmlFor="iisLog">Upload IIS log</label>
            <input id="iisLog" type="file" />
          </div>
          <div>
            <label htmlFor="bookingID">Booking ID</label>
            <input id="bookingID" type="text" />
          </div>
        </form>
        <input form="input-form" type="submit" />
      </div>
      <h2>Sb Log Analysis</h2>
      <div className={styles["output-container"]}>
        <div className={styles["output-content"]}>
          <div className={styles["line-numbers"]}>
            {sbOutput.map(({ lineNumber }, i) => (
              <div key={i} className={styles["line-number"]}>
                {lineNumber}
              </div>
            ))}
          </div>
          <div className={styles["code-content"]}>

            {sbOutput.map(({ highlightedLine }, i) => (
              <code key={i} className={styles["code-text"]}>
                {highlightedLine}
              </code>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
