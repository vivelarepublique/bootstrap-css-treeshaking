const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { argv } = require('process');
const { createInterface } = require('readline');

const css = readFileSync('bootstrap.css', { encoding: 'utf-8' });

const paragraph = (css.includes('\r\n') ? css.split(/(?<=\r\n\})\r\n(?=\r\n)/gm) : css.split(/(?<=\n\})\n(?=\n)/gm)).map(el => el.trim());
const cssContent = paragraph.map(el => {
    const index = el.indexOf('{');
    return {
        selector: el
            .substring(0, index)
            .split(',')
            .map(items => items.trim()),
        content: el.substring(index),
        overall: el,
    };
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});

globalStyle();

function mediaQueries(globalStyle) {
    rl.question('Do you need to load the styles of \x1b[35mMedia Queries\x1b[0m ? (\x1b[32myes\x1b[0m/\x1b[31mno\x1b[0m, default is \x1b[32myes\x1b[0m): ', input => {
        input = input.trim().toLowerCase();
        console.log(input ? input : 'yes');

        if (input === 'yes' || !input) {
            writeCssFile(globalStyle, true, argv?.[2]);
            rl.close();
        } else if (input === 'no') {
            writeCssFile(globalStyle, false, argv?.[2]);
            rl.close();
        } else {
            console.log('unrecognized input!');
            mediaQueries();
        }
    });
}

function globalStyle() {
    rl.question('Do you need to load the styles of \x1b[34mhtml\x1b[0m and \x1b[33mbody\x1b[0m? (\x1b[32myes\x1b[0m/\x1b[31mno\x1b[0m, default is \x1b[32myes\x1b[0m): ', input => {
        input = input.trim().toLowerCase();
        console.log(input ? input : 'yes');

        if (input === 'yes' || !input) {
            mediaQueries(true);
        } else if (input === 'no') {
            mediaQueries(false);
        } else {
            console.log('unrecognized input!');
            globalStyle();
        }
    });
}

function writeCssFile(globalStyle, mediaQueries, fileArgument) {
    const specialElements = [':root', 'html', 'body'];

    if (fileArgument) {
        const html = readFileSync(argv[2], { encoding: 'utf-8' });
        const body = html.match(/(?<=<body>)([\s\S]*)(?=<\/body>)/i)?.[0];

        //specialElements
        const specialElementsResult = [];
        if (globalStyle) {
            specialElements.forEach(el => specialElementsResult.push(cssContent.find(({ selector }) => selector?.[0].trim() === el).overall));
            specialElementsResult.push(`*,\n*::before,\n*::after {\n\tbox-sizing: border-box;\n}`);
        }

        //elements
        const elements = body.match(/(?<=<)\w+(?=\s|(?=>))/g);
        const elementArray = Array.from(new Set(elements));

        const elementsResult = [];

        elementArray.forEach((el, _, self) => {
            cssContent.forEach(({ selector, content }) => {
                selector.forEach(item => {
                    if (self.includes(item)) {
                        const result = {
                            a: item,
                            b: content,
                        };
                        elementsResult.push(result);
                    }
                    if (item.includes(':') && item.substring(0, item.indexOf(':')) === el) {
                        const result = {
                            a: item,
                            b: content,
                        };
                        elementsResult.push(result);
                    }
                });
            });
        });

        //class names
        const classNames = body.match(/(?<=class=")[a-zA-Z0-9\-\s]+?(?=")/g);
        const classNameArray = Array.from(new Set(Array.from(classNames).reduce((acc, cur) => acc.concat(cur.split(' ')), [])));

        const classNamesResult = [];

        classNameArray.forEach((el, _, self) => {
            cssContent.forEach(({ selector, content }) => {
                selector.forEach(item => {
                    if (item.includes('>') || item.includes('+')) {
                        if (item.match(/(?<=\.)[a-zA-Z0-9\-]+/g)?.every(m => self.includes(m))) {
                            const result = {
                                a: item,
                                b: content,
                            };
                            classNamesResult.push(result);
                        }
                    } else if (item.includes(':')) {
                        if (item.substring(1, item.indexOf(':')) === el) {
                            const result = {
                                a: item,
                                b: content,
                            };
                            classNamesResult.push(result);
                        }
                    } else if (self.includes(item.substring(1))) {
                        const result = {
                            a: item,
                            b: content,
                        };
                        classNamesResult.push(result);
                    }
                });
            });
        });

        //types
        const types = body.match(/(?<=type=").+?(?=")/g);
        const typeArray = Array.from(new Set(types));

        const typesResult = [];

        typeArray.forEach(el => {
            const elString = `input[type=\"${el}\"]`;
            cssContent.forEach(({ selector, content }) => {
                if (selector.includes(elString)) {
                    const result = {
                        a: elString,
                        b: content,
                    };
                    typesResult.push(result);
                }
            });
        });

        //mediaQueries
        const mediaQueriesResult = [];
        if (mediaQueries) {
            const mediaQueries = cssContent.filter(({ selector }) => selector?.[0].includes('@media'));
            mediaQueries.forEach(({ selector, content }) => {
                const classRules = (content.includes('\r\n') ? content.substring(1, content.length - 1).split(/(?<=\})\r\n(?=\r\n)/gm) : content.substring(1, content.length - 1).split(/(?<=\})\n(?=\n)/gm)).map(el => el.trim());
                const subRule = [];
                classRules.forEach(el => {
                    const index = el.indexOf('{');
                    const subSelector = [];
                    el.substring(0, index)
                        .split(',')
                        .map(item => item.trim())
                        .forEach(item => {
                            if (item.includes('>') || item.includes('+') || item.includes(' ')) {
                                if (item.match(/(?<=\.)[a-zA-Z0-9\-]+/g)?.every(m => classNameArray.includes(m))) subSelector.push(item);
                            } else if (item.includes(':')) {
                                const colonIndex = item.indexOf(':');
                                if (classNameArray.includes(item.substring(1, colonIndex))) subSelector.push(item);
                            } else if (classNameArray.includes(item.substring(1))) {
                                subSelector.push(item);
                            }
                        });
                    if (subSelector.length) {
                        const result = subSelector.reduce((acc, cur) => acc + ',\n\t' + cur) + ' ' + el.substring(index);
                        subRule.push(result);
                    }
                });
                if (subRule.length) {
                    const result = selector + ' {\n\t' + subRule.reduce((acc, cur) => acc + '\n\n\t' + cur) + '\n}\n';
                    mediaQueriesResult.push(result);
                }
            });
        }

        //console.log(elementArray, '\n', classNameArray, '\n', typeArray);

        const minCss = [...specialElementsResult, ...mergeCss(elementsResult), ...mergeCss(classNamesResult), ...mergeCss(typesResult), ...mediaQueriesResult].reduce((acc, cur) => acc + '\n\n' + cur, '').trim();

        try {
            writeFileSync(join('test/', 'min.css'), minCss);
            console.log('The CSS file after treeshaking has been written to .\\test\\min.css');
        } catch (error) {
            console.log('File write failed.');
        }
    } else {
        console.log('The template html file was not found, please make sure that the command you executed contains an html file. \nSuch as: npm run begin .\\test\\index.html');
    }
}

function mergeCss(arr) {
    const uniqueArr = arr.filter((item, index, self) => index === self.findIndex(el => el.a === item.a && el.b === item.b));

    const merged = uniqueArr
        .reduce((acc, cur) => {
            const index = acc.findIndex(el => el.b === cur.b);
            if (index !== -1) {
                acc[index].a = [acc[index].a, cur.a].sort().join(',\n');
            } else {
                acc.push(cur);
            }
            return acc;
        }, [])
        .reduce((acc, cur) => {
            const index = acc.findIndex(el => el.a === cur.a);
            if (index !== -1) {
                const accCss = acc[index].b.match(/[^\{\n\}]+/gm) ?? [];
                const curCss = cur.b.match(/[^\{\n\}]+/gm) ?? [];
                const newCss = Array.from(new Set([...accCss, ...curCss]))
                    .sort()
                    .reduce((ac, cu) => ac + '\n' + cu);
                acc[index].b = '{\n' + newCss + '\n}';
            } else {
                acc.push(cur);
            }
            return acc;
        }, [])
        .map(el => el.a + ' ' + el.b)
        .sort();

    return merged;
}
