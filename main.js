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

    console.log(require);

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
                    selected = cm.getRange(sel.start, sel.end),
                    suggestions = ['one', 'two'].reverse(),
                    divider = menu.suggestionDivider,
                    lastItems = menu.suggestionItems;

                // remove the suggestions divider if it exists already
                if (divider) {
                    menu.removeMenuDivider(divider);
                }

                // remove the last suggestions added to the menu if they exist
                if (lastItems) {
                    lastItems.forEach(function (item) {
                        menu.removeMenuItem(item);
                    });
                }

                if (!misses[selected]) {
                    return;
                }

                //if (misses[selected] === true) {
                    var _initial = new Date();
                    misses[selected] = typo.suggest(selected);
                    var _final = new Date();
                    console.log((_final.getTime() - _initial.getTime())/1000);
                //}
                console.log(misses[selected]);

                menu.suggestionDivider = menu.addMenuDivider(Menus.FIRST).id;
                menu.suggestionItems = [];
                suggestions.forEach(function (item, i) {
                    var t = 'a-' + performance.now();
                    menu.suggestionItems.push(t);
                    CommandManager.register(item, t, function () {
                        cm.replaceRange(item, sel.start, sel.end);
                    });
                    menu.addMenuItem(t, null, Menus.FIRST);
                });
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

        var spellOverlay = {
            token: function (stream, state) {
                var ch, current;
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

                        if (misses[current] || typo.check(current) === false) {
                            misses[current] = true;

                            /*// web worker call for spelling suggestion
                            var worker = new Worker('fetchSuggestions.js');

                            worker.onMessage = function(e) {
                                console.log(e);
                            };

                            worker.postMessage([current]);*/

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
