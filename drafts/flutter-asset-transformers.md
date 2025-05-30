---
title: Flutter Asset Transformers
domain: software-engineering-corner.hashnode.dev
tags: flutter
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1742813951840/3oCdaFzXq.png?auto=format
publishAs: bvoq
hideFromHashnodeCommunity: false
saveAsDraft: true
enableToc: true
---

Language-based compile-time macros have recently been rejected from the Dart language over hot-reloading speed concerns [\[^1\]](https://docs.flutter.dev/ui/assets/asset-transformation).

Prioritising a simpler base language and having fast, hot-reloading speeds is, in my view, the right call.

However, all is not lost as some learnings have been carried over to Flutter.

One of these has been augmentations, which will make code produced by code-generation tools like `build_runner` much nicer, as you won't need `extends` or `with` clauses anymore to extend existing classes.

Another lesser-known feature is that of asset transformers [\[^2\]](https://medium.com/dartlang/an-update-on-dart-macros-data-serialization-06d3037d4f12).

It is intended for transforming assets at compile-time, to prepare them for their final destination in a production-ready app.

For each asset, one or multiple transformations can be applied. However,  each transformation takes in exactly one asset and outputs one asset.

The main example of an asset transformer is the `vector_graphics_compiler` [\[^3\]](https://pub.dev/packages/vector_graphics_compiler), which was published by the Flutter team to transfer some work of the vector graphics pipeline to the compile-time.

You can apply a transformer to an asset as follows. In the assets section in your `pubspec.yaml`, you can add another sequence entry `transformers` to your asset specifying the transfomer and optionally some arguments.

```yaml
flutter:
  assets:
    - path: assets/logo.svg
      flavors:
        - staging
        - production
      transformers:
        - package: vector_graphics_compiler
          args: ['--tessellate', '--font-size=14']
```

Writing your transformer is a peace of cake. Just create a new dart package with a standard `pubspec.yaml` file and a `bin/my_transformer.dart` file.

Inside the `bin/my_transformers.dart` file, you will need to handle the `input` and the `output` arguments.

# Creating a download transformer

We recently needed an alternative to storing our asset files in a git repo.

Storing assets in a git repo makes for slow pull requests (unless you pay for Git LFS) and requires the design team to be proficient with git.

Instead of relying on this, we created our own asset transformer which handles downloading files at compile-time for us.

The asset transformer caches the results until the asset directory is changed in which case the assets are redownloaded/retransformed.

You can test the transformer by adding a file, say `downloaded_image.png`, to the asset folder and add a simple line with the source of your file. You can use our company logo as the source of your file: [`https://www.zuehlke.com/sites/default/files/images/zuehlke_standard_purple_rgb-1.png`](https://www.zuehlke.com/sites/default/files/images/zuehlke_standard_purple_rgb-1.png)

Next, we need to add this asset to `pubspec.yaml`.

```yaml
flutter:
  assets:
    - path: assets/downloaded_image.png
      transformers:
        - package: download_transformer
```

The download transformer just reads this line for each asset and attempts to download this file from the internet.

To install the download\_transformer, you can either copy the dart code at the end of this article and create your own asset transformer package or simply import the pub.dev package [\[^4\]](https://pub.dev/packages/download_transformer) in your pubspec.yaml as a dev\_depnendency:

```yaml
dev_dependencies:
  download_transformer: ^1.0.2
```

Building the app will now place the downloaded asset into your applications asset folder.

The download\_transformer is a simple script that downloads the file as follows:

```dart
import 'dart:io';

import 'package:args/args.dart';
import 'package:http/http.dart' as http;

const inputOptionName = 'input';
const outputOptionName = 'output';

Future<int> main(List<String> arguments) async {
  // The flutter tool will invoke this program with two arguments, one for
  // the `--input` option and one for the `--output` option.
  // `--input` is the original asset file that this program should transform.
  // `--output` is where flutter expects the transformation output to be written to.
  final parser =
      ArgParser()
        ..addOption(inputOptionName, mandatory: true, abbr: 'i')
        ..addOption(outputOptionName, mandatory: true, abbr: 'o');

  ArgResults argResults = parser.parse(arguments);
  final String inputFilePath = argResults[inputOptionName];
  final String outputFilePath = argResults[outputOptionName];

  try {
    final inputFile = File(inputFilePath);
    if (!inputFile.existsSync()) {
      stderr.writeln('Input file does not exist: $inputFilePath');
      return 1;
    }
    final lines = inputFile.readAsLinesSync();

    for (final line in lines) {
      final parts = line.split(RegExp(r'\s+|,'));
      if (parts.length != 1) {
        stderr.writeln('Expected format: <asset_link>');
        return 1;
      }

      final assetLink = parts[0];
      final response = await http.get(Uri.parse(assetLink));
      if (response.statusCode == 200) {
        final assetFile = File(outputFilePath);
        await assetFile.writeAsBytes(response.bodyBytes);
        print('Downloaded $assetLink to $outputFilePath\n');
      } else {
        stderr.writeln(
          'Failed to download $assetLink (HTTP ${response.statusCode})',
        );
        stderr.writeln('Reason: ${response.reasonPhrase}');
        return 1;
      }
    }
    return 0;
  } catch (e) {
    stderr.writeln(
      'Unexpected exception when downloading an asset.\n'
      'Details: $e',
    );
    return 1;
  }
}
```

## Wrap-up

I hope you learnt something new and will use flutter asset transformers in the future.

## References

\[^1\]: [https://docs.flutter.dev/ui/assets/asset-transformation](https://docs.flutter.dev/ui/assets/asset-transformation)

\[^2\]: [https://medium.com/dartlang/an-update-on-dart-macros-data-serialization-06d3037d4f12](https://medium.com/dartlang/an-update-on-dart-macros-data-serialization-06d3037d4f12)

\[^3\]: [https://pub.dev/packages/vector_graphics_compiler](https://pub.dev/packages/vector_graphics_compiler)

\[^4\]: [https://pub.dev/packages/download_transformer](https://pub.dev/packages/download_transformer)

