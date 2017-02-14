'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as request from 'request';
import * as fs from 'fs';

module WandboxVSCode
{
    const extentionName = "wandbox-vscode";
    var fileSetting = { };

    function deepCopy(source : any) : any
    {
        return JSON.parse(JSON.stringify(source));
    }

    function stripDirectory(path : string) : string
    {
        return path
            .split('\\').reverse()[0]
            .split('/').reverse()[0];
    }

    var outputChannel :vscode.OutputChannel;

    function makeSureOutputChannel() :vscode.OutputChannel
    {
        if (!outputChannel)
        {
            outputChannel = vscode.window.createOutputChannel
            (
                getConfiguration("outputChannelName")
            );
        }
        else
        {
            outputChannel.appendLine('');
        }
        return outputChannel;
    }

    function bowWow() : void
    {
        outputChannel.show();
        outputChannel.appendLine(`🐾 Bow-wow! ${new Date().toString()}`);
    }

    function IsOpenFiles(files : string[]) : boolean
    {
        var hasError = false;
        files.forEach
        (
            file =>
            {
                var hit = false;
                vscode.workspace.textDocuments.forEach
                (
                    document =>
                    {
                        hit = hit || file === stripDirectory(document.fileName);
                    }
                );
                if (!hit)
                {
                    hasError = true;
                    outputChannel.appendLine(`🚫 Not found file: ${file} ( If opened, show this file once. And keep to open it.)`);
                }
            }
        );
        return !hasError;
    }

    function getActiveDocument() :vscode.TextDocument
    {
        var activeTextEditor = vscode.window.activeTextEditor;
        if (null !== activeTextEditor && undefined !== activeTextEditor)
        {
            var document = activeTextEditor.document;
            if (null !== document && undefined !== document)
            {
                return document;
            }
        }
        return null;
    };

    function showJson(titile : string, json : any) : void
    {
        var provider = vscode.workspace.registerTextDocumentContentProvider
        (
            'wandbox-vscode-json',
            new class implements vscode.TextDocumentContentProvider
            {
                provideTextDocumentContent(_uri: vscode.Uri, _token: vscode.CancellationToken)
                    : string | Thenable<string>
                {
                    return JSON.stringify(json, null, 4);
                }
            }
        );
        var date = new Date(); // 結果がキャッシュされようにする為
        var stamp = date.getFullYear().toString()
            +("0" +(date.getMonth() +1).toString()).slice(-2)
            +("0" +date.getDate().toString()).slice(-2)
            +"-"
            +("0" +date.getHours().toString()).slice(-2)
            +("0" +date.getMinutes().toString()).slice(-2)
            +("0" +date.getSeconds().toString()).slice(-2);
        vscode.workspace.openTextDocument
        (
            vscode.Uri.parse(`wandbox-vscode-json://wandbox-vscode/${stamp}/${titile}.json`)
        )
        .then
        (
            (value: vscode.TextDocument) =>
            {
                vscode.window.showTextDocument(value);
                provider.dispose();
            }
        );
    }

    function getConfiguration(key ?: string) : any
    {
        var configuration = vscode.workspace.getConfiguration("wandbox");
        return key ?
            configuration[key]:
            configuration;
    }

    function getCurrentFilename() : string
    {
        var result : string;
        var document = getActiveDocument();
        if (null !== document)
        {
            result = document.fileName;
        }
        if (!result)
        {
            result = "wandbox-vscode:default";
        }
        return result;
    }

    function getWandboxServerUrl() :string
    {
        var result : string;
        var setting = fileSetting[getCurrentFilename()];
        if (setting)
        {
            result = setting.server;
        }
        if (!result)
        {
            result = getConfiguration("defaultServer");
        }
        if (result.endsWith("/"))
        {
            result = result.substr(0, result.length -1);
        }
        return result;
    }

    function getWandboxCompilerName(vscodeLang :string, fileName :string) :string
    {
        var result : string;
        var setting = fileSetting[fileName];
        if (setting)
        {
            result = setting.compiler;
        }
        if (!result && vscodeLang)
        {
            result = getConfiguration("languageCompilerMapping")[vscodeLang];
        }
        if (!result && fileName)
        {
            var elements = fileName.split('.');
            if (2 <= elements.length)
            {
                var extension = elements[elements.length -1];
                result = getConfiguration("extensionCompilerMapping")[extension];
            }
        }
        return result;
    }

    function getList(callback : (string) => void) : void
    {
        var requestUrl = getWandboxServerUrl() +`/api/list.json?from=${extentionName}`;
        outputChannel.appendLine(`HTTP GET ${requestUrl}`);
        request.get
        (
            requestUrl,
            function(error, response, body)
            {
                if (!error && response.statusCode === 200)
                {
                    callback(body);
                }
                else
                if (response.statusCode)
                {
                    outputChannel.appendLine(`statusCode: ${response.statusCode}`);
                }
                else
                {
                    outputChannel.appendLine(`error: ${error}`);
                }
            }
        );
    }

    var list : {[name : string] : any[] } = { };

    function makeSureList(callback : (list :any[]) => void) : void
    {
        var key = getWandboxServerUrl();
        if (!list[key])
        {
            getList(body => callback(list[key] = JSON.parse(body)));
        }
        else
        {
            callback(list[key]);
        }
    }

    function showWandboxSettings() : void
    {
        showJson
        (
            "setting",
            {
                "basicSetting": getConfiguration(),
                "fileSetting": fileSetting
            }
        );
    }

    function showWandboxWeb() : void
    {
        vscode.commands.executeCommand
        (
            'vscode.open',
            vscode.Uri.parse(getWandboxServerUrl() +`/?from=${extentionName}`)
        );
    }

    function showWandboxCompiers() : void
    {
        makeSureOutputChannel();
        bowWow();

        makeSureList
        (
            list =>
            {
                if (list)
                {
                    var languageNames :string[] = [];
                    list.forEach(item => languageNames.push(item.language));
                    languageNames = languageNames.filter((value, i, self) => self.indexOf(value) === i);
                    languageNames.sort();
                    var languages = {};
                    languageNames.forEach(item => languages[item] = languages[item] || []);
                    list.forEach
                    (
                        item =>
                        {
                            var displayItem = deepCopy(item);
                            delete displayItem.switches;
                            languages[displayItem.language].push(displayItem);
                        }
                    );
                    languageNames.forEach
                    (
                        language =>
                        {
                            outputChannel.appendLine(`📚 ${language}`);
                            languages[language].forEach
                            (
                                item =>
                                {
                                    var displayItem = deepCopy(item);
                                    delete displayItem.switches;
                                    outputChannel.appendLine(`${item.name}\t${JSON.stringify(displayItem)}`);
                                }
                            );
                        }
                    );
                }
            }
        );
    }

    function showWandboxOptions() : void
    {
        makeSureOutputChannel();
        bowWow();

        var document = getActiveDocument();
        if (null !== document)
        {
            var compilerName = getWandboxCompilerName
            (
                document.languageId,
                document.fileName
            );
            if (compilerName)
            {
                makeSureList
                (
                    list =>
                    {
                        var hit :any;
                        if (list)
                        {
                            list.forEach
                            (
                                item =>
                                {
                                    if (compilerName === item.name)
                                    {
                                        hit = item;
                                    }
                                }
                            );
                        }

                        if (!hit)
                        {
                            outputChannel.appendLine('🚫 Unknown compiler!');
                            outputChannel.appendLine('👉 You can set a compiler by [Wandbox: Set Compiler] command.');
                            outputChannel.appendLine('👉 You can see compilers list by [Wandbox: Show Compilers] command.');
                        }
                        else
                        {
                            if (!hit.switches || 0 === hit.switches.length)
                            {
                                outputChannel.appendLine('this compiler has no options');
                            }
                            else
                            {
                                outputChannel.appendLine('option\tdetails');
                                hit.switches.forEach
                                (
                                    item =>
                                    {
                                        if (item.options)
                                        {
                                            item.options.forEach
                                            (
                                                item =>
                                                {
                                                    outputChannel.appendLine(`${item.name}\t${JSON.stringify(item)}`);
                                                }
                                            );
                                        }
                                        else
                                        {
                                            outputChannel.appendLine(`${item.name}\t${JSON.stringify(item)}`);
                                        }
                                    }
                                );
                            }
                        }
                    }
                );
            }
            else
            {
                outputChannel.appendLine('🚫 Unknown language!');
                outputChannel.appendLine('👉 You can use set a compiler by [Wandbox: Set Compiler] command.');
                outputChannel.appendLine('👉 You can see compilers list by [Wandbox: Show Compilers] command.');
            }
        }
        else
        {
            outputChannel.appendLine('🚫 No active text editor!');
        }
    }
    
    function showWandboxListJson() : void
    {
        makeSureOutputChannel();
        bowWow();

        getList
        (
            body => showJson
            (
                "list",
                list[getWandboxServerUrl()] = JSON.parse(body)
            )
        );
    }
    
    function setSetting(name : string, prompt: string) : void
    {
        makeSureOutputChannel();
        bowWow();

        var document = getActiveDocument();
        if (null !== document)
        {
            var fileName = document.fileName;
            vscode.window.showInputBox({ prompt:prompt }).then
            (
                value =>
                {
                    if (value)
                    {
                        fileSetting[fileName] = fileSetting[fileName] || { };
                        if ('additionals' === name)
                        {
                            var newFiles = value.split(',');
                            if (IsOpenFiles(newFiles))
                            {
                                fileSetting[fileName][name] = newFiles;
                                outputChannel.appendLine(`Set ${name} "${newFiles.join('","')}" for "${fileName}"`);
                            }
                        }
                        else
                        if (name)
                        {
                            try
                            {
                                fileSetting[fileName][name] = JSON.parse(`"${value}"`);
                                outputChannel.appendLine(`Set ${name} "${value}" for "${fileName}"`);
                            }
                            catch(Err)
                            {
                                outputChannel.appendLine(`🚫 ${Err}`);
                            }
                        }
                        else
                        {
                            try
                            {
                                fileSetting[fileName] = JSON.parse(value);
                                outputChannel.appendLine(`Set settings for "${fileName}"`);
                                outputChannel.appendLine(JSON.stringify(fileSetting[fileName], null, 4));
                            }
                            catch(Err)
                            {
                                outputChannel.appendLine(`🚫 ${Err}`);
                            }
                        }
                    }
                    else
                    {
                        fileSetting[fileName][name] = null;
                    }
                }
            );
        }
        else
        {
            outputChannel.appendLine('🚫 No active text editor!');
        }
    }

    function resetWandboxFileSettings() : void
    {
        makeSureOutputChannel();
        bowWow();

        var document = getActiveDocument();
        if (null !== document)
        {
            var fileName = document.fileName;
            if (fileSetting[fileName])
            {
                delete fileSetting[fileName];
                outputChannel.appendLine(`Reset settings for "${fileName}"`);
            }
            else
            {
                outputChannel.appendLine(`⚠️ Not found settings for "${fileName}"`);
            }
        }
        else
        {
            outputChannel.appendLine('🚫 No active text editor!');
        }
    }
    
    function invokeWandbox(args ?: any) : void
    {
        makeSureOutputChannel();
        bowWow();

        var document = getActiveDocument();
        if (null !== document)
        {
            var compilerName = getWandboxCompilerName
            (
                document.languageId,
                document.fileName
            );
            var additionals : string[];
            var options : string = getConfiguration("options")[compilerName];
            var stdIn : string;
            var compilerOptionRaw : string = getConfiguration("compilerOptionRaw")[compilerName];
            var runtimeOptionRaw : string = getConfiguration("runtimeOptionRaw")[compilerName];
            var setting = fileSetting[document.fileName];
            if (setting)
            {
                additionals = setting['codes'];
                if (undefined !== setting['options'])
                {
                    options = setting['options'];
                }
                stdIn = setting['stdin'];
                if (undefined !== setting['compiler-option-raw'])
                {
                    compilerOptionRaw = setting['compiler-option-raw'];
                }
                if (undefined !== setting['runtime-option-raw'])
                {
                    runtimeOptionRaw = setting['runtime-option-raw'];
                }
            }

            if (compilerName)
            {
                var requestUrl = getWandboxServerUrl() +`/api/compile.json`;
                outputChannel.appendLine(`HTTP POST ${requestUrl}`);
                var json =
                {
                    compiler: compilerName,
                    code: document.fileName
                };
                if (additionals)
                {
                    if (!IsOpenFiles(additionals))
                    {
                        return;
                    }
                    //  ログ表示用のダミー。実際にPOSTするデータはこの後で再設定。
                    json['codes'] = additionals.join(',');
                }
                if (options)
                {
                    json['options'] = options;
                }
                if (stdIn)
                {
                    json['stdin'] = stdIn;
                }
                if (compilerOptionRaw)
                {
                    json['compiler-option-raw'] = compilerOptionRaw;
                }
                if (runtimeOptionRaw)
                {
                    json['runtime-option-raw'] = runtimeOptionRaw;
                }
                if (args && args.share)
                {
                    json['save'] = true;
                }
                var simplifyPostData = getConfiguration("simplifyPostData");
                if (simplifyPostData)
                {
                    outputChannel.appendLine(JSON.stringify(json, null, 4));
                }
                if (additionals)
                {
                    json['codes'] = [];
                    additionals.forEach
                    (
                        filename =>
                        {
                            var code : string;
                            vscode.workspace.textDocuments.forEach
                            (
                                document =>
                                {
                                    if (filename === stripDirectory(document.fileName))
                                    {
                                        code = document.getText();
                                    }
                                }
                            );
                            json['codes'].push
                            (
                                {
                                    'file': filename,
                                    'code': code
                                }
                            );
                        }
                    );
                }
                json['code'] = document.getText();
                json['from'] = extentionName;
                if (!simplifyPostData)
                {
                    outputChannel.appendLine(JSON.stringify(json, null, 4));
                }
                var startAt = new Date();
                request
                (
                    {
                        url: requestUrl,
                        method: 'POST',
                        headers:
                        {
                            //'Content-Type': 'application/json',
                            'User-Agent': extentionName
                        },
                        json: json
                    },
                    function(error, response, body)
                    {
                        var endAt = new Date();
                        if (response.statusCode)
                        {
                            outputChannel.appendLine(`HTTP statusCode: ${response.statusCode}`);
                        }
                        if (!error && response.statusCode === 200)
                        {
                            if (body.status)
                            {
                                outputChannel.appendLine(`status: ${body.status}`);
                            }
                            if (body.signal)
                            {
                                outputChannel.appendLine(`🚦 signal: ${body.signal}`);
                            }
                            if (body.compiler_output)
                            {
                                outputChannel.appendLine('compiler_output: ');
                                outputChannel.appendLine(body.compiler_output);
                            }
                            if (body.compiler_error)
                            {
                                outputChannel.appendLine('🚫 compiler_error: ');
                                outputChannel.appendLine(body.compiler_error);
                            }
                            //body.compiler_message
                            //merged messages compiler_output and compiler_error
                            if (body.program_output)
                            {
                                outputChannel.appendLine('program_output: ');
                                outputChannel.appendLine(body.program_output);
                            }
                            if (body.program_error)
                            {
                                outputChannel.appendLine('🚫 program_error: ');
                                outputChannel.appendLine(body.program_error);
                            }
                            //body.program_message
                            //merged messages program_output and program_error
                            //body.permlink && outputChannel.appendLine(`🔗 permlink: ${body.permlink}`);
                            if (body.url)
                            {
                                outputChannel.appendLine(`🔗 url: ${body.url}`);
                                if (getConfiguration("autoOpenShareUrl"))
                                {
                                    vscode.commands.executeCommand
                                    (
                                        'vscode.open',
                                        vscode.Uri.parse(body.url)
                                    );
                                }
                            }

                        }
                        else
                        {
                            if (body)
                            {
                                outputChannel.appendLine(body);
                            }
                            if (error)
                            {
                                outputChannel.appendLine(`🚫 error: ${error}`);
                            }
                        }
                        outputChannel.appendLine(`🏁 time: ${(endAt.getTime() -startAt.getTime()) /1000} s`);
                    }
                );
            }
            else
            {
                outputChannel.appendLine('🚫 Unknown language!');
                outputChannel.appendLine('👉 You can use set a compiler by [Wandbox: Set Compiler] command.');
                outputChannel.appendLine('👉 You can see compilers list by [Wandbox: Show Compilers] command.');
            }
        }
        else
        {
            outputChannel.appendLine('🚫 No active text editor!');
        }
    }
    
    var newDocument =
    {
        text: null,
        fileExtension: null
    };

    function helloWandbox() : void
    {
        vscode.window.showInputBox({ prompt:"Enter file extension ( e.g.: sh, c, cpp, d ... )" }).then
        (
            fileExtension =>
            {
                makeSureOutputChannel();
                bowWow();

                while(fileExtension.startsWith("."))
                {
                    fileExtension = fileExtension.substr(1);
                }

                var extensionPath = vscode.extensions.getExtension("wraith13.wandbox-vscode").extensionPath;
                var userFiles : string[];
                userFiles = getConfiguration("helloWolrdFiles");
                if (fileExtension)
                {
                    var helloFilePath = `${extensionPath}/hellos/hello.${fileExtension}`;
                    userFiles.forEach
                    (
                        (i : string ) =>
                        {
                            var parts = i.split(".");
                            if (parts[parts.length -1] === fileExtension)
                            {
                                helloFilePath = i;
                            }
                        }
                    );
                    //console.log(`✨️ Open a hello world as a new file. ( Source is "${helloFilePath}" )`);
                    outputChannel.appendLine(`✨️ Open a [Hello, world!] as a new file.`);
                    fs.exists
                    (
                        helloFilePath,
                        (exists : boolean) =>
                        {
                            if (exists)
                            {
                                fs.readFile
                                (
                                    helloFilePath, (err : NodeJS.ErrnoException, data : Buffer) =>
                                    {
                                        if (err)
                                        {
                                            outputChannel.appendLine("🚫 " + err.message);
                                        }
                                        else
                                        {
                                            newDocument.text = data.toString();
                                            newDocument.fileExtension = fileExtension;

                                            //  ドキュメント上は vscode.workspace.openTextDocument() で language を指定して新規ファイルオープン
                                            //  できることになってるっぽいんだけど、実際にそういうことができないので代わりに workbench.action.files.newUntitledFile
                                            //  を使っている。 untitled: を使ったやり方は保存予定の実パスを指定する必要があり、ここの目的には沿わない。

                                            //  language を指定して新規ファイルオープンできるようになったらその方法での実装に切り替えることを検討すること。

                                            vscode.commands.executeCommand("workbench.action.files.newUntitledFile")
                                            .then
                                            (
                                                (_value :{} ) =>
                                                {
                                                    //  ここでは新規オープンされた document 周りの情報がなにも取得できないのでなにもできない。
                                                    //  なので　vscode.window.onDidChangeActiveTextEditor　で処理している。
                                                }
                                            );
                                
                                        }
                                    }
                                );
                            }
                            else
                            {
                                outputChannel.appendLine("🚫 Unknown file extension!");
                                outputChannel.appendLine('👉 You can set hello world files by [wandbox.helloWolrdFiles] setting.');
                            }
                        }
                    );
                }
                else
                {
                    fs.readdir
                    (
                        `${extensionPath}/hellos`,
                        (err : NodeJS.ErrnoException, files : string[]) =>
                        {
                            if (err)
                            {
                                outputChannel.appendLine("🚫 " + err.message);
                            }
                            else
                            {
                                const hello = "hello.";
                                var fileExtensionList = [];
                                files.forEach
                                (
                                    (i : string) => 
                                    {
                                        if (i.startsWith(hello))
                                        {
                                            fileExtensionList.push(i.substr(hello.length));
                                        }
                                    }
                                );
                                userFiles.forEach
                                (
                                    (i : string ) =>
                                    {
                                        var parts = i.split(".");
                                        fileExtensionList.push(parts[parts.length -1]);
                                    }
                                );
                                
                                fileExtensionList = fileExtensionList.filter((value, i, self) => self.indexOf(value) === i);
                                fileExtensionList.sort();
                                
                                outputChannel.appendLine('Available hello world list ( file extensions ):');
                                outputChannel.appendLine(`${fileExtensionList.join(", ")}`);
                            }
                        }
                    );
                }
            }
        );
    }
    
    export function registerCommand(context: vscode.ExtensionContext) : void
    {
        [
            {
                command: 'extension.showWandboxSettings',
                callback: showWandboxSettings
            },
            {
                command: 'extension.showWandboxWeb',
                callback: showWandboxWeb
            },
            {
                command: 'extension.showWandboxCompiers',
                callback: showWandboxCompiers
            },
            {
                command: 'extension.showWandboxOptions',
                callback: showWandboxOptions
            },
            {
                command: 'extension.showWandboxListJson',
                callback: showWandboxListJson
            },
            {
                command: 'extension.setWandboxFileServer',
                callback: () => setSetting('server', 'Enter server url')
            },
            {
                command: 'extension.setWandboxFileCompiler',
                callback: () => setSetting('compiler', 'Enter compiler name')
            },
            {
                command: 'extension.setWandboxFileAdditionals',
                callback: () => setSetting('codes', 'Enter file names ( just file names without directory )')
            },
            {
                command: 'extension.setWandboxFileStdIn',
                callback: () => setSetting('stdin', 'Enter stdin text ( When you want to user multiline text, Use [Wandbox: Set Settings JSON] command. )')
            },
            {
                command: 'extension.setWandboxFileOptions',
                callback: () => setSetting('options', 'Enter compiler option ( You can see compiler option list by [Wandbox: Show Compier Info] )')
            },
            {
                command: 'extension.setWandboxFileCompilerOptionRaw',
                callback: () => setSetting('compiler-option-raw', 'Enter compiler option raw')
            },
            {
                command: 'extension.setWandboxFileRuntimeOptionRaw',
                callback: () => setSetting('runtime-option-raw', 'Enter runtime option raw')
            },
            {
                command: 'extension.setWandboxFileSettingJson',
                callback: () => setSetting(null, 'Enter settings JSON')
            },
            {
                command: 'extension.resetWandboxFileSettings',
                callback: resetWandboxFileSettings
            },
            {
                command: 'extension.invokeWandbox',
                callback: () => invokeWandbox()
            },
            {
                command: 'extension.shareWandbox',
                callback: () => invokeWandbox({ share: true })
            },
            {
                command: 'extension.helloWandbox',
                callback: helloWandbox
            }
        ]
        .forEach
        (
            i =>
            context.subscriptions.push
            (
                vscode.commands.registerCommand
                (
                    i.command,
                    i.callback
                )
            )
        );

        vscode.workspace.onDidCloseTextDocument
        (
            (document : vscode.TextDocument) =>
            {
                if (document.isUntitled && fileSetting[document.fileName])
                {
                    delete fileSetting[document.fileName];
                }
            }
        );

        vscode.window.onDidChangeActiveTextEditor
        (
            (textEditor : vscode.TextEditor) =>
            {
                if (textEditor.document.isUntitled && newDocument.text)
                {
                    var activeTextEditor = vscode.window.activeTextEditor;
                    activeTextEditor.edit
                    (
                        (editBuilder: vscode.TextEditorEdit) =>
                        {
                            editBuilder.insert(new vscode.Position(0,0), newDocument.text);
                        }
                    );
                    var document = getActiveDocument();
                    var fileName = document.fileName;
                    var compiler = getConfiguration("extensionCompilerMapping")[newDocument.fileExtension];
                    if (compiler)
                    {
                        fileSetting[fileName] = fileSetting[fileName] || { };
                        fileSetting[fileName]['compiler'] = compiler;
                    }

                    newDocument.text = null;
                    newDocument.fileExtension = null;
                }
            }
        );
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
    WandboxVSCode.registerCommand(context);
}

// this method is called when your extension is deactivated
export function deactivate()
{
}