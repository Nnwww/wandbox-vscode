# wandbox-vscode

[Wandbox](http://melpon.org/wandbox)([GitHub](https://github.com/melpon/wandbox/)) is a social compilation service. This extension is Wandbox front-end for Visual Studio Code.

> Wandbox is provided from [@melpon](https://github.com/melpon)( 🐕 dog) as a personal voluntary service.
> For keep this service, please do not put a high load on this service.

## Features

wandbox-vscode provide several commands in the Command Palette.

## Main Commands

* `Wandbox: Run` : run a current document on wandbox
* `Wandbox: Share` : make a share url

> You can disable to auto open share url by `wandbox.autoOpenShareUrl` setting.

## Show Commands

* `Wandbox: Show Compilers` : show available compilers list on wandbox
* `Wandbox: Show Options` : show options of a current compiler
* `Wandbox: Show Raw JSON` : show a wandbox specs as raw JSON
* `Wandbox: Show Web Site` : open wandbox web site
* `Wandbox: Show Settings` : show all wandbox-vscode settings

## Setting Commands

Target of all setting commands is a current document.
Effect of all setting commands expires with next Visual Studio Code process.

* `Wandbox: Set Server` : set a wandbox server url

> You can use [`http://wandbox.fetus.jp/`](http://wandbox.fetus.jp/) . This Wandbox server has a wide variety of PHP compilers.
> This Wandbox server is provided from [@fetus-hina](https://github.com/fetus-hina) as a personal voluntary service.
> For keep this service, please do not put a high load on this service.

* `Wandbox: Set Compiler` : set a compiler 
* `Wandbox: Set Additional Files` : set additional source files
* `Wandbox: Set StdIn` : set stdin text
* `Wandbox: Set Options` : set compiler options
* `Wandbox: Set Compiler Option Raw` : set raw compiler option
* `Wandbox: Set Runtime Option Raw` : set raw runtime option
* `Wandbox: Set Settings JSON` : set all temporary settings by JSON
* `Wandbox: Reset Settings` : reset all temporary settings


## Extension Settings

This extension contributes the following settings:

* `wandbox.defaultSerer`: default wandbox server url
* `wandbox.autoOpenShareUrl`: when make a share url, auto open it
* `wandbox.languageCompilerMapping`: set compiler by language
* `wandbox.extensionCompilerMapping`: set compiler by file extension
* `wandbox.options`: set options by compiler
* `wandbox.compilerOptionRaw`: set raw option by compiler
* `wandbox.runtimeOptionRaw`: set raw runtime option by compiler

## Release Notes

### 1.0.0

Initial release of wandbox-vscode.

## "Wandbox has not my favorite compiler!"

No probrem! You can pull request to [wandbox](https://github.com/melpon/wandbox/)!

## Support

[GitHub Issues](https://github.com/wraith13/wandbox-vscode/issues)

## License

[Boost Software License](https://github.com/wraith13/wandbox-vscode/blob/master/LICENSE_1_0.txt)

## Acknowledgments

Thanks [@melpon](https://github.com/melpon)( 🐕 dog) and [@kikairoya](https://github.com/kikairoya)( 🐂 bull) for awesome compilation service!

Thanks [@rhysd](https://github.com/rhysd)( 🐕 dog) for your support in TypeScript!

Thanks [@chomado](https://github.com/chomado)( 👧 girl) for a great extension icon!
