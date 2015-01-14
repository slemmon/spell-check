/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

var affBlob, dictBlob;

/** Simple extension that adds a "File > Hello World" menu item */
define(function (require, exports, module) {
    "use strict";

    var CommandManager  = brackets.getModule("command/CommandManager"),
        Menus           = brackets.getModule("command/Menus"),
        Editor          = brackets.getModule('editor/Editor'),
        EditorManager   = brackets.getModule('editor/EditorManager'),
        AppInit         = brackets.getModule("utils/AppInit"),
        ExtensionUtils  = brackets.getModule("utils/ExtensionUtils"),
        Menus           = brackets.getModule("command/Menus");

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

    require('text');

    var typo;

    require(['text!dictionaries/en_US/en_US.aff', 'text!dictionaries/en_US/en_US.dic', 'typo'], function (aff, dict) {
        affBlob = aff;
        dictBlob = dict;
        typo = new Typo("en_US");
    });

    var editor, cm;

    AppInit.appReady(function () {
        AppInit.htmlReady(function () {
            EditorManager.on('activeEditorChange', function () {
                editor = EditorManager.getCurrentFullEditor(),
                cm = editor._codeMirror;

                handleHelloWorld();

                var myEditor = EditorManager.getActiveEditor();
                $(myEditor).on('cursorActivity', function (a, b) {
                    var c = myEditor._codeMirror;

                    var A1 = c.getCursor().line;
                    var A2 = c.getCursor().ch;

                    var B1 = c.findWordAt({line: A1, ch: A2}).anchor.ch;
                    var B2 = c.findWordAt({line: A1, ch: A2}).head.ch;

                    //console.log(EditorManager.getCurrentFullEditor().getSelection());
                    var sel = EditorManager.getCurrentFullEditor().getSelection();
                    //console.log(c.getRange(sel.start, sel.end)); // SELECTED WORD

                    /*var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

                    $(contextMenu).on("beforeContextMenuOpen", function (a) {
                        var t = 'a-' + 0;
                        CommandManager.register('TEST', t, testFn);
                        contextMenu.addMenuItem(t);
                        //console.log(EditorManager.getCurrentFullEditor().getSelection());
                    });*/

                    //console.log(c.getRange({line: A1,ch: B1}, {line: A1,ch: B2})); //get the word at the cursor
                    //c.replaceRange('EDITED', {line: A1,ch: B1}, {line: A1,ch: B2});
                });

                /*$(myEditor).on('cursorActivity', function(){
                    var A1 = myEditor.getCursor().line;
                    var A2 = myEditor.getCursor().ch;

                    var B1 = myEditor.findWordAt({line: A1, ch: A2}).anchor.ch;
                    var B2 = myEditor.findWordAt({line: A1, ch: A2}).head.ch;

                    console.log(myEditor.getRange({line: A1,ch: B1}, {line: A1,ch: B2}));
                });*/
            });

            var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);

            $(contextMenu).on("beforeContextMenuOpen", function (a) {
                var c = EditorManager.getActiveEditor()._codeMirror;
                var sel = EditorManager.getCurrentFullEditor().getSelection();

                var suggestions = ['one', 'two'].reverse();

                if (contextMenu.suggestionDivider) {
                    contextMenu.removeMenuDivider(contextMenu.suggestionDivider);
                }

                if (contextMenu.suggestionItems && contextMenu.suggestionItems.length > 0) {
                    contextMenu.suggestionItems.forEach(function (item) {
                        contextMenu.removeMenuItem(item);
                    });
                }

                contextMenu.suggestionDivider = contextMenu.addMenuDivider(Menus.FIRST).id;
                contextMenu.suggestionItems = [];
                suggestions.forEach(function (item, i) {
                    var t = 'a-' + performance.now();
                    contextMenu.suggestionItems.push(t);
                    CommandManager.register(item, t, function () {
                        c.replaceRange(item, sel.start, sel.end);
                    });
                    contextMenu.addMenuItem(t, null, Menus.FIRST);
                });
            });
        });
    });

    // Function to run when the menu item is clicked
    function handleHelloWorld() {
        //var rx_word = new RegExp("[^\!\'\"\#\$\%\&\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~\ 0-9]");
        var rx_word = new RegExp('[a-z]', 'i');

        // var camelCaseRegEx = new RegExp('([A-Z]|[a-z])([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*');  http://stackoverflow.com/questions/1128305/regular-expression-to-identify-camelcased-words

        var spellOverlay = {
            token: function (stream, state) {
              var ch;
              // conditional to check to see if the line is a single or block comment before checking the spelling
              if (stream.string.match(/^(\s+)?\*.+|^(\s+)?\/\/.+/ig)) {
                  if (stream.match(rx_word)) {
                    while ((ch = stream.peek()) != null) {
                          if (!ch.match(rx_word)) {
                            break;
                          }
                          stream.next();
                    }

                    if (typo.check(stream.current()) === false) {
                        return "underline";
                    }
                    return null;
                  }
              }
              while (stream.next() != null && !stream.match(rx_word, false)) {}
              return null;
            }
        };

        if (cm) {
            cm.removeOverlay(spellOverlay);
            cm.addOverlay(spellOverlay);
        }
    }

    // First, register a command - a UI-less object associating an id to a handler
    var MY_COMMAND_ID = "helloworld.sayhello";   // package-style naming to avoid collisions
    CommandManager.register("Hello World", MY_COMMAND_ID, handleHelloWorld);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(MY_COMMAND_ID);

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, "Ctrl-Alt-H");
    // (Note: "Ctrl" is automatically mapped to "Cmd" on Mac)
});
