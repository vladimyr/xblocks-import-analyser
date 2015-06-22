from redbaron import RedBaron
import sys
import optparse
import json

CODE_IDENTIFIER = "__code__"
DICT_ARGS_IDENTIFIER = "__dict_args__"

parser = optparse.OptionParser()
parser.add_option('-s', '--source', dest="setup_file")
parser.add_option('-d', '--debug', action="store_true", dest="debug")
options, remainder = parser.parse_args()

if options.setup_file:
    source_code = open(options.setup_file, "r")
else:
    source_code = sys.stdin

red = RedBaron(source_code.read())


def is_setup_args_node(ast_node):
    if ast_node.previous:
        return ast_node.previous.type == "name" and ast_node.previous.value == "setup"

    return False


def escape_quotes(code_str):
    return code_str.replace("'", "\"")


def json_code_object(code_str):
    return str({CODE_IDENTIFIER: escape_quotes(code_str)})


def process_fn_calls(ast_node):
    parent = ast_node.parent
    if parent and not parent.processed:
        call_code = json_code_object(parent.dumps())
        parent.value = RedBaron(call_code)[0]
        parent.processed = True


def process_dict_args(ast_node):
    parent = ast_node.parent
    dict_arg_code = json_code_object(ast_node.dumps())

    # obtain __dict_args__ array
    if not parent.dict_args:
        parent.value.append(DICT_ARGS_IDENTIFIER + "=[]")
        dict_args = parent.value[-1]
    else:
        dict_args = parent.dict_args

    # add dict argument to special __dict_args__ array
    dict_args.value.append(dict_arg_code)
    index = ast_node.index_on_parent

    # remove dict argument from args array
    del ast_node.parent.value[index]


def process_named_values(ast_node):
    parent = ast_node.parent
    if parent and parent.value == ast_node \
            and ast_node.value != "True" and ast_node.value != "False":
        named_value_code = json_code_object(ast_node.dumps())
        parent.value = RedBaron(named_value_code)[0]


def dump_info(**kwargs):
    return json.dumps(kwargs, indent=2)


setup_node = red.find("call", lambda ast_node: is_setup_args_node(ast_node))

args = setup_node.value
args.find_all("dict_argument").apply(lambda ast_node: process_dict_args(ast_node))
args.find_all("name", lambda ast_node: process_named_values(ast_node))
args.find_all("call").apply(lambda ast_node: process_fn_calls(ast_node))

setup_node.previous.value = "dump_info"
setup_call_node = setup_node.parent

code = setup_call_node.dumps()
if options.debug:
    print >> sys.stderr, code

setup_info = eval(code)
print setup_info
