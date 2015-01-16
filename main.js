/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

var affBlob, dictBlob;

/** Class description placeholder */
define(function (require, exports, module) {
    "use strict";

    var CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        Editor          = brackets.getModule('editor/Editor'),
        EditorManager   = brackets.getModule('editor/EditorManager'),
        AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        FileUtils       = brackets.getModule('file/FileUtils'),
        misses          = {},
        typo, menu;

    require('text');
    require(['text!dictionaries/en_US/en_US.aff', 'text!dictionaries/en_US/en_US.dic', 'typo'], function (aff, dict) {
        affBlob = aff;
        dictBlob = dict;
        typo = new Typo("en_US");
    });

    /*
    // context menu
    var spellingContextId = 'spellingContextId';
    var testFn = function () {
        console.log('Test Function');
    };
    CommandManager.register('TEST', spellingContextId, testFn);
    var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
    //contextMenu.addMenuItem(spellingContextId);

    $(contextMenu).on("beforeContextMenuOpen", function (a) {
        var t = 'a-' + 0;
        CommandManager.register('TEST', t, testFn)
        contextMenu.addMenuItem(t);
        //console.log(EditorManager.getCurrentFullEditor().getSelection());
    });*/

    //var myContextMenu = Menus.registerContextMenu('myMenu');
    //console.log(myContextMenu);

    ExtensionUtils.loadStyleSheet(module, "styles.css");

    var getIgnoredWords = function () {
        var ignoredWords = localStorage.getItem('slemmon.spell-check');
        return ignoredWords ? JSON.parse(ignoredWords) : {};
    }

    var setIgnoredWords = function (words) {
        words = (jQuery.isArray(words)) ? words : [words];
        var ignoredWords = getIgnoredWords();
        words.forEach(function (word) {
            ignoredWords[word] = true;
        });
        localStorage.setItem('slemmon.spell-check', JSON.stringify(ignoredWords));
        return ignoredWords;
    }

    var clearIgnoredWords = function () {
        localStorage.removeItem('slemmon.spell-check');
    }

    AppInit.appReady(function () {
        AppInit.htmlReady(function () {
            // runs the following logic each time an editor (file) is focused
            EditorManager.on('activeEditorChange', function () {
                //editor = EditorManager.getCurrentFullEditor(),
                //cm = editor._codeMirror;

                spellCheckEditor();

                /*//var myEditor = EditorManager.getActiveEditor();
                $(editor).on('cursorActivity', function (a, b) {
                    var A1 = cm.getCursor().line;
                    var A2 = cm.getCursor().ch;

                    var B1 = cm.findWordAt({line: A1, ch: A2}).anchor.ch;
                    var B2 = cm.findWordAt({line: A1, ch: A2}).head.ch;

                    //console.log(EditorManager.getCurrentFullEditor().getSelection());
                    var sel = EditorManager.getCurrentFullEditor().getSelection();
                    //console.log(c.getRange(sel.start, sel.end)); // SELECTED WORD

                    //var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

                    //$(contextMenu).on("beforeContextMenuOpen", function (a) {
                        //var t = 'a-' + 0;
                        //ComdmandManager.register('TEST', t, testFn);
                        //contextMenu.addMenuItem(t);
                        //console.log(EditorManager.getCurrentFullEditor().getSelection());
                    //});

                    //console.log(c.getRange({line: A1,ch: B1}, {line: A1,ch: B2})); //get the word at the cursor
                    //c.replaceRange('EDITED', {line: A1,ch: B1}, {line: A1,ch: B2});
                });*/

                /*$(myEditor).on('cursorActivity', function(){
                    var A1 = myEditor.getCursor().line;
                    var A2 = myEditor.getCursor().ch;

                    var B1 = myEditor.findWordAt({line: A1, ch: A2}).anchor.ch;
                    var B2 = myEditor.findWordAt({line: A1, ch: A2}).head.ch;

                    console.log(myEditor.getRange({line: A1,ch: B1}, {line: A1,ch: B2}));
                });*/
            });

            menu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

            $(menu).on("beforeContextMenuOpen", function (a) {
                var editor = EditorManager.getCurrentFullEditor(),
                    cm = editor._codeMirror,
                    sel = editor.getSelection(),
                    selectedWord = cm.getRange(sel.start, sel.end),
                    suggestions = misses[selectedWord],
                    dividers = menu.suggestionDivider || [],
                    lastItems = menu.suggestionItems;

                // remove the suggestions divider if it exists already
                /*if (divider) {
                    menu.removeMenuDivider(divider);
                    menu.suggestionDivider = null;
                }*/

                dividers.forEach(function (divider) {
                    menu.removeMenuDivider(divider);
                });
                menu.suggestionDivider = [];

                // remove the last suggestions added to the menu if they exist
                if (lastItems) {
                    lastItems.forEach(function (item) {
                        menu.removeMenuItem(item);
                    });
                    menu.suggestionItems = null;
                }

                if (!misses[selectedWord]) {
                    return;
                }

                if (misses[selectedWord] === true) {
                    //var _initial = new Date();
                    misses[selectedWord] = suggestions = typo.suggest(selectedWord).reverse();
                    //var _final = new Date();
                    //console.log((_final.getTime() - _initial.getTime())/1000);
                }

                suggestions = suggestions.reverse();

                menu.suggestionDivider.push(menu.addMenuDivider(Menus.FIRST).id);
                menu.suggestionItems = [];

                var cmdId = 'a-' + performance.now();
                menu.suggestionItems.push(cmdId);
                CommandManager.register('* IGNORE - ' + selectedWord, cmdId, function () {
                    setIgnoredWords(selectedWord);
                    misses[selectedWord] = null;
                    spellCheckEditor();
                });
                menu.addMenuItem(cmdId, null, Menus.FIRST);

                if (suggestions.length > 0) {
                    menu.suggestionDivider.push(menu.addMenuDivider(Menus.FIRST).id);

                    suggestions.forEach(function (item, i) {
                        var cmdId = 'a-' + performance.now();
                        menu.suggestionItems.push(cmdId);
                        CommandManager.register(item, cmdId, function () {
                            cm.replaceRange(item, sel.start, sel.end);
                        });
                        menu.addMenuItem(cmdId, null, Menus.FIRST);
                    });
                }
            });
        });
    });

    function evalLineType(line) {
        var rx_js_block = /^(\s+)?\*.+/ig,  // javascript block comment
            rx_js_line = /^(\s+)?\/\/.+/ig; // javascript single line comment

        if (line.match(rx_js_block)) {
            return true;
        }
        if (line.match(rx_js_line)) {
            return true;
        }
        return false;
    }

    // spell check the current editor
    function spellCheckEditor() {
        var editor = EditorManager.getCurrentFullEditor(),
            cm = editor ? editor._codeMirror : false,
            rx_alpha = new RegExp('[a-z]', 'i');

        // var camelCaseRegEx = new RegExp('([A-Z]|[a-z])([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*');  http://stackoverflow.com/questions/1128305/regular-expression-to-identify-camelcased-words

        var suggestQueue = [];
        var queuedCt = 0;

        var spellOverlay = {
            token: function (stream, state) {
                //var suggestQueue = [],
                //var queuedCt = 0,
                var modulePath = FileUtils.getNativeModuleDirectoryPath(module) + '/',
                    workerPath = modulePath + 'fetchSuggestions.js',
                    ch, current, spawnWorker;

                // see if the line type is allowed for spelling check
                if (evalLineType(stream.string)) {

                    if (stream.match(rx_alpha)) {
                        while ((ch = stream.peek()) != null) {
                            if (!ch.match(rx_alpha)) {
                                break;
                            }
                            stream.next();
                        }

                        current = stream.current();

                        spawnWorker = function () {
                            if (suggestQueue.length === 0 || queuedCt > 7) {
                                return false;
                            }

                            var worker = new Worker(workerPath);

                            queuedCt++;

                            worker.onmessage = function(e) {
                                misses[current] = e.data.split(',');
                                queuedCt--;
                                spawnWorker();
                            };

                            //console.log('I should process: ' + suggestQueue.pop());
                            //worker.postMessage(suggestQueue.pop());

                            var msg = {
                                aff: affBlob,
                                dict: dictBlob,
                                word: suggestQueue.pop()
                            };

                            //console.log(suggestQueue);
                            //worker.postMessage(JSON.stringify(msg));
                            worker.postMessage(JSON.stringify(msg));
                        }

                        if (misses[current] || (!getIgnoredWords()[current] && typo.check(current) === false)) {
                            if (misses[current] === undefined) {
                                misses[current] = true;
                                suggestQueue.push(current);
                                spawnWorker();
                            }

                            /*// web worker call for spelling suggestion
                            var worker = new Worker(workerPath);

                            worker.onmessage = function(e) {
                                //console.log(current, e);
                                console.log(queuedCt);
                            };

                            worker.isProcessingWord = current;
                            worker.postMessage(current);*/

                            return "underline";
                        }
                        return null;
                    }
                }
                while (stream.next() != null && !stream.match(rx_alpha, false)) {}
                return null;
            }
        };

        if (cm) {
            cm.removeOverlay(spellOverlay);
            cm.addOverlay(spellOverlay);
        }
    }
});
