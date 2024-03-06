const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const mdSigns = {
    '**': ['<b>', '</b>'],
    '_': ['<i>', '</i>'],
    '`': ['<tt>', '</tt>']
};

const processMarkdownFile = (pathToMd, outputPath) => {
    fs.readFile(pathToMd, 'utf8', (err, data) => {
        if (err) {
            console.error(`Ошибка чтения файла: ${err}`);
            rl.close();
            return;
        }

        const lines = data.split(/\r\n\s*\n/); // paragraphing

        // creating html paragraphs
        const paragraphs = lines.map((ln) => {
            ln = `<p> ${ln} </p>`;
            return ln;
        });

        // word breaking
        const words = paragraphs.map((prgrph) => {
            return prgrph.split(/[\s\r\n]+/);
        }).flat();

        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        let pref = false;
        let star = 0;
        let underline = 0;
        let literal = 0;
        let combination = 0;
        let preformated = 0;
        const htmlTags = words.map((wrd) => {
            let htmlTag = wrd;
            if (wrd.includes('```')) {
                if(pref){
                    htmlTag = htmlTag.replace(/```/g, '</pre>');
                    preformated--;
                }
                else{
                    htmlTag = htmlTag.replace(/```/g, '<pre> ');
                    preformated++;
                }
                pref = !pref;
                return htmlTag;
            }
            if (!pref) {
                for (const [key, [openingTag, closingTag]] of Object.entries(mdSigns)) {
                    const escapedKey = escapeRegExp(key);
                    const regexStart = new RegExp(`^${escapedKey}`);
                    const regexEnd = new RegExp(`${escapedKey}$`);
                    const regexTest = new RegExp(`^(${escapedKey}\\*\\*|${escapedKey}_|${escapedKey}\`)`);
                    const keyLength = key.length;
                    const wordLength = htmlTag.length;
                    if (regexTest.test(htmlTag)){
                        combination++;
                    }

                    if (htmlTag.startsWith(key) && keyLength < wordLength) {
                        htmlTag = htmlTag.replace(regexStart, openingTag);
                        switch (key) {
                            case '**':
                                star++;
                                break;
                            case '_':
                                underline++;
                                break;
                            case '`':
                                literal++;
                                break;
                        }
                    }
                    if (htmlTag.endsWith(key) && keyLength < wordLength) {
                        htmlTag = htmlTag.replace(regexEnd, closingTag);
                        switch (key) {
                            case '**':
                                star--;
                                break;
                            case '_':
                                underline--;
                                break;
                            case '`':
                                literal--;
                                break;
                        }
                    }
                }
            }
            return htmlTag;
        });

        //checking for errors
        if (combination){
            console.error('Error: trying to combinate markdown, example: **_text_**');
        } else if (star != 0 || underline != 0 || literal != 0 || preformated != 0) {
            console.error('Error: Some tags were not closed/opened');
        } 
        else {
            const htmlContent = htmlTags.join(' ');

            if(outputPath) {
                fs.writeFile(outputPath, htmlContent, (err) => {
                    if (err) {
                        console.error(`File write error: ${err}`);
                    } 
                    else {
                        console.log(`The result was successfully saved to the file: ${outputPath}`);
                    }
                    rl.close();
                });
            }
            else {
                console.log(htmlContent)
            }
        }

        rl.close();
    });
};

// Getting command line arguments
const args = process.argv.slice(2);
const pathToMd = args[0];
let outputPath = 0;

const outIndex = args.indexOf('--out');
if (outIndex !== -1 && outIndex + 1 < args.length) {
    outputPath = args[outIndex + 1];
}
processMarkdownFile(pathToMd, outputPath);
