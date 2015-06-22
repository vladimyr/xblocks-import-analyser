# How to use this thing?

Clone repo to your local drive and then run it like this:
```bash
$ ./analyse-imports <github-url>
```

example urls to try with:

* 3D Model Viewer XBlock: https://github.com/ExtensionEngine/xblock_3d_viewer
* Animation XBlock: https://github.com/pmitros/AnimationXBlock
* Brightcove Video XBlock: https://github.com/edx-solutions/xblock-brightcove

It will output list of imported modules for given XBlock github repo.

## NOTE

Be sure to have python installed. Also before running this tool install RedBaron module with following command:
```bash
$ pip install --upgrade redbaron
```