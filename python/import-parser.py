from redbaron import RedBaron
import sys
import optparse
import json

parser = optparse.OptionParser()
parser.add_option('-s', '--source', dest="source_file")
options, remainder = parser.parse_args()

if options.source_file:
    source_code = open(options.source_file, "r")
else:
    source_code = sys.stdin

imported_modules = []

red = RedBaron(source_code.read())
import_nodes = red.find_all(lambda identifier: identifier == "import" or identifier == "from_import")

for import_node in import_nodes:
    lineno = import_node.absolute_bounding_box.top_left.line
    code = import_node.dumps()
    modules = None

    def is_valid_module(module_path):
        return not (module_path.endswith(".(") or module_path.endswith(".)"))

    if import_node.type == "from_import":
        modules = filter(is_valid_module, import_node.full_path_modules())
    elif import_node.type == "import":
        modules = import_node.modules()

    imported_modules.append({
        'lineno': lineno,
        'code': code,
        'modules': modules
    })


print json.dumps(imported_modules, indent=2)
