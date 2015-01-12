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

    console.log(Menus.ContextMenu.assignContextMenuToSelector);

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
                    //console.log(a);
                });
            });
        });
    });

    // Function to run when the menu item is clicked
    function handleHelloWorld() {
        var rx_word = new RegExp("[^\!\"\#\$\%\&\(\)\*\+\,\-\.\/\:\;\<\=\>\?\@\[\\\]\^\_\`\{\|\}\~\ ]");
        var spellOverlay = {
            token: function (stream, state) {
              var ch;
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
