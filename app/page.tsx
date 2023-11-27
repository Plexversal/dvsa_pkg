'use client';
import styles from "../styles/page.module.css"
import { useState } from 'react'
import { errors, uncommon_errors, eventsToIgnore } from '../lib/common_errors'
type LineWithHighlight = {
  highlightedLine: JSX.Element;
  lineNumber: number;
};
export default function Home() {
  const [sbFile, setSbFile] = useState<File>()
  const [testLoadEvents, setTestLoadEvents] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false);
  const [sbAllErrorsOutput, setSbAllErrorsOutput] = useState<LineWithHighlight[]>([]);
  const [sbUncommonErrors, setSbUncommonErrors] = useState<LineWithHighlight[]>([]);
  const [networkError, setNetworkError] = useState<number>(0)
  const [longTime, setLogTime] = useState<number>(0)
  const [whiteScreens, setWhiteScreens] = useState<number>(0)
  const [anaylized, setAnaylized] = useState<boolean>(false)


  const [sbSlowToLoad, setSbSlowToLoad] = useState<LineWithHighlight[]>([])


  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!sbFile) return alert('Sb Log is required')
    setIsLoading(true)
    const fileReader = new FileReader();


    fileReader.onload = (event) => {
      const fileContent = event.target?.result;
      if (typeof fileContent === 'string') {
        const lines = fileContent.split(/\r\n|\n/); // split text file based on new lines and form array of strings
        setTestLoadEvents(lines.filter(e => e.includes("INFO: Application Exit")).length)
    
        let fluctuationCount = 0;
        let longTimeEnd = 0;
        let whiteScreen = 0

        const matchedLines = lines.reduce<LineWithHighlight[]>((acc, line, index) => {
          if (errors.some(str => line.includes(str))) {
            const highlightedLine = highlightText(line, errors);
            acc.push({ highlightedLine, lineNumber: index + 1 });
          }

          return acc;
        }, []);
        const uncommonErrors = lines.reduce<LineWithHighlight[]>((acc, line, index) => {
          if (uncommon_errors.some(str => line.includes(str))) {
            const highlightedLine = highlightText(line, uncommon_errors);
            acc.push({ highlightedLine, lineNumber: index + 1 });
          }
          if (line.includes("network fluctuation")) {
            fluctuationCount++;
          }
          return acc;
        }, []);
        setNetworkError(fluctuationCount)

        const threshold = 1000 * 60 * 3; // 2 minutes in milliseconds
        let previousLine = lines[0];
        let previousDate:any = parseDate(previousLine);
        let previousIndex = 0;
    
        const matchedSlowed = lines.slice(1).reduce<LineWithHighlight[]>((acc, line, index) => {
          const currentDate:any = parseDate(line);
          if (previousDate && currentDate) {
            const timeDiff = currentDate - previousDate;
            if (timeDiff > threshold && !eventsToIgnore.some(str => line.includes(str))) {
              const timeDiffFormatted = formatTimeDiff(timeDiff);
              whiteScreen++
              // Get 5 lines before and 5 lines after
              const start = previousIndex - 2; // 5 lines before the previous line
              const end = index + 4; // 5 lines after the current line
      
              const contextLines = getRangeOfLines(lines, start, end).map((contextLine:any, ctxIndex:any) => {
                const isHighlighted = ctxIndex === 2 || ctxIndex === 3; // Highlight the 6th and 7th lines (0-based index)
                const lineNum = start + ctxIndex + 1; // Correct line number
                if (contextLine.includes('Finish.aspx')) {
                  longTimeEnd++;
                }
                return {
                  highlightedLine: isHighlighted ? highlightText(`${timeDiffFormatted} ${contextLine}`, [timeDiffFormatted]) : contextLine,
                  lineNumber: lineNum
                };
              });
      
              acc.push(...contextLines); // Spread to add all context lines
            }
          }
          previousLine = line;
          previousDate = currentDate;
          previousIndex = index + 1;
          return acc;
        }, []);

        setLogTime(longTimeEnd)
        setWhiteScreens(whiteScreen)
    
        setSbAllErrorsOutput(matchedLines);
        setSbUncommonErrors(uncommonErrors)
        setSbSlowToLoad(matchedSlowed);
        setIsLoading(false)
        setAnaylized(true)
      } else {
        alert('Error reading file content');
        setIsLoading(false)

      }
    };

    fileReader.onerror = function() {
        alert('Error reading file');
        setIsLoading(false)

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
  
  function parseDate(line: string) {
    const datePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}.\d{4}/;
    const match = line.match(datePattern) 
    return match ? new Date(match[0]) : null
  }

  function formatTimeDiff(milliseconds: number) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function getRangeOfLines(lines:any, start:any, end:any) {
    return lines.slice(Math.max(start, 0), Math.min(end, lines.length));
  }

  // logs for specific sections only


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

      {
        isLoading ? <div>Loading</div> : <div>
              {
                anaylized && <div className={styles['general-info']}>
                <h2>General Info</h2>

                <table>
                  <tr>
                    <th>Exam Load Events</th>
                    <td>{testLoadEvents}</td>

                  </tr>
                  <tr>
                    <th>Network fluctuations found</th>
                    <td>{networkError > 0 ? networkError : 'None Found'}</td>

                  </tr>
                  <tr>
                    <th>White screens</th>
                    <td>{longTime > 0 ? longTime : 'None Suspected'}</td>
                  </tr>
                  <tr>
                    <th>Long time to clear on test end</th>
                    <td>{longTime > 0 ? longTime : 'None Suspected'}</td>
                  </tr>
                </table>
              </div>
              }
          {
            sbSlowToLoad.length > 0 && <div>


              <h2>Sb Log Suspected slow to load</h2>
              <p><i>More than 3 mins and excludes time between candidates</i></p>
            <div className={styles["output-container"]}>
              <div className={styles["output-content"]}>
                <div className={styles["line-numbers"]}>
                  {sbSlowToLoad.map(({ lineNumber }, i) => (
                    <div key={i} className={styles["line-number"]}>
                      {lineNumber}
                    </div>
                  ))}
                </div>
                <div className={styles["code-content"]}>
  
                  {sbSlowToLoad.map(({ highlightedLine }, i) => (
                    <code key={i} className={styles["code-text"]}>
                      {highlightedLine}
                    </code>
                  ))}
                </div>
              </div>
            </div>
            </div>
          }
        {
          sbUncommonErrors.length > 0 && <div>
          <h2>Sb uncommon Log Errors Found</h2>
          <div className={styles["output-container"]}>
            <div className={styles["output-content"]}>
              <div className={styles["line-numbers"]}>
                {sbUncommonErrors.map(({ lineNumber }, i) => (
                  <div key={i} className={styles["line-number"]}>
                    {lineNumber}
                  </div>
                ))}
              </div>
              <div className={styles["code-content"]}>

                {sbUncommonErrors.map(({ highlightedLine }, i) => (
                  <code key={i} className={styles["code-text"]}>
                    {highlightedLine}
                  </code>
                ))}
              </div>
            </div>
          </div>
          </div>
          }
                  
        {
          sbAllErrorsOutput.length > 0 && <div>
          <h2>Sb All Log Errors Found</h2>
          <p><i>Most errors here are normal and expected</i></p>

          <div className={styles["output-container"]}>
            <div className={styles["output-content"]}>
              <div className={styles["line-numbers"]}>
                {sbAllErrorsOutput.map(({ lineNumber }, i) => (
                  <div key={i} className={styles["line-number"]}>
                    {lineNumber}
                  </div>
                ))}
              </div>
              <div className={styles["code-content"]}>

                {sbAllErrorsOutput.map(({ highlightedLine }, i) => (
                  <code key={i} className={styles["code-text"]}>
                    {highlightedLine}
                  </code>
                ))}
              </div>
            </div>
          </div>
          </div>
          }
          
        


        </div>
      }

      
    </main>
  );
}
