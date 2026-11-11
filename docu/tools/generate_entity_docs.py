#!/usr/bin/env python3
"""
Erzeugt die Doku je Entity (docu/entities/<Entity>.md) und je Solr-Kern (docu/solr-cores/<KERN>.md) aus dem Code,
Regel des Nutzers vom 2026-11-09 (siehe docu/entities/README.md):

- je Entity: Zweck (aus dem Javadoc), Tabelle, Felder, Beispiel-JSON, alle Endpunkte, die sie oder ihre DTOs
  übertragen, alle Methoden in Backend und Frontend, die sie benutzen;
- Rückverweise im Code: Javadoc der Entity, Javadoc der Controller, Kommentar am Frontend-Typ;
- je Solr-Kern: alle Felder aus einem Export (GET /api/admin/solr-core/export/<KERN>), z. B.
  python3 docu/tools/generate_entity_docs.py --solr-export FILE=/pfad/zum/export.json

Aufruf aus dem Projektordner (gebiter9k): python3 docu/tools/generate_entity_docs.py
Nach jeder Änderung an einer Entity, einem Endpunkt oder einem Solr-Feld erneut laufen lassen.
"""

import argparse
import json
import os
import re
from collections import OrderedDict

PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BACKEND_DIR = os.path.join(PROJECT_DIR, 'code', 'backend', 'src', 'main', 'java')
FRONTEND_DIR = os.path.join(PROJECT_DIR, 'code', 'frontend', 'src')
ENTITY_DOCS_DIR = os.path.join(PROJECT_DIR, 'docu', 'entities')
SOLR_CORE_DOCS_DIR = os.path.join(PROJECT_DIR, 'docu', 'solr-cores')

MAPPING_METHODS = {'GetMapping': 'GET', 'PostMapping': 'POST', 'PutMapping': 'PUT', 'DeleteMapping': 'DELETE'}
CONTROL_KEYWORDS = {'if', 'for', 'while', 'switch', 'catch', 'return', 'new', 'else', 'try', 'do', 'synchronized', 'throw'}
SENSITIVE_NAME_PARTS = ('password', 'secret', 'tokenhash', 'token')
EXAMPLE_INSTANT = '2026-11-09T14:05:27Z'
EXAMPLE_GUID = '019a6b2c-3d4e-7f80-9a1b-2c3d4e5f6a7b'


def read_text(path):
    with open(path, encoding='utf-8') as source:
        return source.read()


def write_text(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as target:
        target.write(text)


def relative_link(from_dir, target_path):
    return os.path.relpath(target_path, from_dir).replace(os.sep, '/')


def list_files(base_dir, suffixes):
    found = []
    for root, _, file_names in os.walk(base_dir):
        if 'node_modules' in root:
            continue
        for file_name in file_names:
            if file_name.endswith(suffixes):
                found.append(os.path.join(root, file_name))
    return sorted(found)


def clean_javadoc(raw_lines):
    """Javadoc-Zeilen ohne Sterne, {@code x} → `x`, {@link A#b} → `A.b`."""
    text_lines = []
    for raw_line in raw_lines:
        line = raw_line.strip()
        line = re.sub(r'^/\*\*', '', line)
        line = re.sub(r'\*/$', '', line)
        line = re.sub(r'^\*', '', line).strip()
        text_lines.append(line)
    text = '\n'.join(text_lines)
    text = re.sub(r'\{@code ([^}]*)\}', r'`\1`', text)
    text = re.sub(r'\{@link(?:plain)? ([^}#\s]*)#?([^}\s]*)[^}]*\}', lambda match: '`' + match.group(1) + ('.' + match.group(2) if match.group(2) else '') + '`', text)
    return text.strip()


def first_paragraph(javadoc_text):
    paragraphs = re.split(r'\n\s*\n|<p>', javadoc_text)
    first = paragraphs[0] if paragraphs else ''
    first = re.sub(r'\s*\n\s*', ' ', first).strip()
    return first


def class_javadoc(source_lines, class_line_index):
    """Das Javadoc direkt vor der Klasse (über Annotationen hinweg) als Zeilen und Index von Anfang und Ende."""
    index = class_line_index - 1
    while index >= 0 and (source_lines[index].strip().startswith('@') or source_lines[index].strip() == '' or source_lines[index].strip().endswith(')') and not source_lines[index].strip().endswith('*/')):
        index = index - 1
    if index < 0 or not source_lines[index].strip().endswith('*/'):
        return None, None, None
    end_index = index
    while index >= 0 and not source_lines[index].strip().startswith('/**'):
        index = index - 1
    return source_lines[index:end_index + 1], index, end_index


def find_class_line(source_lines, kind='class'):
    pattern = re.compile(r'^public\s+(final\s+)?' + kind + r'\s+(\w+)')
    for index, line in enumerate(source_lines):
        if pattern.match(line):
            return index
    return None


# ---------------------------------------------------------------------------------------------------------- Backend

def parse_enums():
    enums = {}
    for path in list_files(BACKEND_DIR, ('.java',)):
        # Kommentare zuerst weg: Ein {@code …} im Javadoc beendete sonst den Rumpf schon vor der ersten Konstante
        text = re.sub(r'/\*.*?\*/', '', read_text(path), flags=re.S)
        match = re.search(r'public\s+enum\s+(\w+)\s*\{(.*?)(;|\})', text, re.S)
        if not match:
            continue
        body = re.sub(r'/\*.*?\*/', '', match.group(2), flags=re.S)
        body = re.sub(r'//[^\n]*', '', body)
        constants = re.findall(r'\b([A-Z][A-Z0-9_]*)\b\s*(?:\(|,|$)', body)
        if constants:
            enums[match.group(1)] = constants
    return enums


def parse_fields(source_text):
    """Die Instanzfelder einer Klasse: Name, Typ, Annotationen, Kommentar, ob es einen Getter gibt."""
    fields = []
    lines = source_text.split('\n')
    annotations = []
    javadoc_lines = []
    in_javadoc = False
    depth = 0
    for line in lines:
        stripped = line.strip()
        if depth == 1:
            if stripped.startswith('/**'):
                in_javadoc = True
                javadoc_lines = []
            if in_javadoc:
                javadoc_lines.append(stripped)
                if stripped.endswith('*/'):
                    in_javadoc = False
                depth += line.count('{') - line.count('}')
                continue
            if stripped.startswith('@'):
                annotations.append(stripped)
            field_match = re.match(r'^(?:private|protected)\s+(?!static)(?:final\s+)?([\w<>, ?\[\]]+?)\s+(\w+)\s*(=.*)?;$', stripped)
            if field_match:
                field_type = field_match.group(1).strip()
                field_name = field_match.group(2)
                fields.append({
                    'name': field_name,
                    'type': field_type,
                    'annotations': list(annotations),
                    'comment': first_paragraph(clean_javadoc(javadoc_lines)) if javadoc_lines else '',
                })
                annotations = []
                javadoc_lines = []
            elif stripped and not stripped.startswith('@') and not stripped.startswith('//') and not stripped.startswith('*'):
                annotations = []
                if not stripped.startswith('/*'):
                    javadoc_lines = []
        depth += line.count('{') - line.count('}')
    for field in fields:
        capitalized = field['name'][0].upper() + field['name'][1:]
        has_getter = re.search(r'public\s+[\w<>, ?\[\]]+\s+(get|is)' + capitalized + r'\s*\(', source_text) is not None
        field['has_getter'] = has_getter
        field['json_ignore'] = any(annotation.startswith('@JsonIgnore') for annotation in field['annotations'])
    return fields


def column_info(field):
    infos = []
    for annotation in field['annotations']:
        if annotation.startswith('@Id'):
            infos.append('Primärschlüssel')
        if annotation.startswith('@GeneratedValue'):
            infos.append('automatisch')
        if annotation.startswith('@Column'):
            if 'nullable = false' in annotation:
                infos.append('Pflicht')
            if 'unique = true' in annotation:
                infos.append('eindeutig')
            length_match = re.search(r'length = (\d+)', annotation)
            if length_match:
                infos.append('max. ' + length_match.group(1) + ' Zeichen')
            name_match = re.search(r'name = "([^"]+)"', annotation)
            if name_match:
                infos.append('Spalte `' + name_match.group(1) + '`')
            if 'jsonb' in annotation:
                infos.append('jsonb')
            if 'updatable = false' in annotation:
                infos.append('unveränderlich')
        if annotation.startswith('@Enumerated'):
            infos.append('Enum als Text')
        if annotation.startswith('@Embedded'):
            infos.append('eingebettet')
    return ', '.join(dict.fromkeys(infos))


def example_value(field_name, field_type, enums, embeddables, depth=0):
    lower_name = field_name.lower()
    base_type = field_type.split('<')[0].strip()
    if base_type in ('List', 'Set', 'Collection'):
        inner_type = field_type[field_type.index('<') + 1:field_type.rindex('>')].strip()
        return [example_value(field_name.rstrip('s'), inner_type, enums, embeddables, depth)]
    if base_type == 'Map':
        return {'de': 'Beispiel'}
    if base_type == 'UUID':
        if 'users' in lower_name or 'owner' in lower_name or 'author' in lower_name or 'guid' in lower_name:
            return '77777777-7777-7777-7777-777777777777'
        return EXAMPLE_GUID
    if base_type in ('Long', 'long', 'Integer', 'int', 'Short', 'short'):
        if lower_name == 'id' or lower_name.endswith('id'):
            return 1
        if 'percent' in lower_name:
            return 100
        return 0
    if base_type in ('Double', 'double', 'Float', 'float'):
        return 0.0
    if base_type in ('Boolean', 'boolean'):
        return False
    if base_type in ('Instant', 'OffsetDateTime', 'LocalDateTime', 'ZonedDateTime', 'Date'):
        return EXAMPLE_INSTANT
    if base_type == 'LocalDate':
        return EXAMPLE_INSTANT[:10]
    if base_type in enums:
        return enums[base_type][0]
    if base_type in embeddables and depth < 2:
        return build_example(embeddables[base_type], enums, embeddables, depth + 1)
    if base_type == 'String':
        if lower_name == 'username':
            return 'alice'
        if lower_name == 'email':
            return 'alice@example.org'
        if 'color' in lower_name:
            return '#e9ff3b'
        if 'base64' in lower_name:
            return 'iVBORw0KGgoAAAANSUhEUgAA…'
        if lower_name.endswith('fileclasskey'):
            return 'FOTO_URLAUB'
        if lower_name.endswith('accessrolekey'):
            return 'USER'
        if lower_name.endswith('accessrolecollectionkey'):
            return 'BUERGER'
        if lower_name.endswith('key') or lower_name == 'key':
            return 'BEISPIEL_KEY'
        if 'emoji' in lower_name:
            return '🔥'
        if 'extension' in lower_name:
            return 'jpg'
        if 'name' in lower_name:
            return 'Beispielname'
        return 'Beispieltext'
    return None


def is_sensitive(field_name):
    lower_name = field_name.lower()
    return any(part in lower_name for part in SENSITIVE_NAME_PARTS)


def build_example(fields, enums, embeddables, depth=0):
    example = OrderedDict()
    for field in fields:
        if not field['has_getter'] or field['json_ignore'] or is_sensitive(field['name']):
            continue
        example[field['name']] = example_value(field['name'], field['type'], enums, embeddables, depth)
    return example


def parse_controllers():
    """Alle Endpunkte: Controller, HTTP-Methode, Pfad, Java-Methode, Signatur."""
    endpoints = []
    for path in list_files(BACKEND_DIR, ('Controller.java',)):
        text = read_text(path)
        if '@RestController' not in text:
            continue
        controller_name = os.path.basename(path)[:-5]
        base_match = re.search(r'@RequestMapping\(\s*(?:value\s*=\s*|path\s*=\s*)?"([^"]*)"', text)
        base_path = base_match.group(1) if base_match else ''
        lines = text.split('\n')
        index = 0
        while index < len(lines):
            stripped = lines[index].strip()
            mapping_match = re.match(r'@(GetMapping|PostMapping|PutMapping|DeleteMapping)(\((.*)\))?', stripped)
            if mapping_match:
                arguments = mapping_match.group(3) or ''
                path_match = re.search(r'"([^"]*)"', arguments)
                sub_path = path_match.group(1) if path_match else ''
                signature_lines = []
                cursor = index + 1
                while cursor < len(lines):
                    signature_lines.append(lines[cursor].strip())
                    if '{' in lines[cursor]:
                        break
                    cursor += 1
                # Nur Annotationen VOR der Methode weglassen (z. B. @PreAuthorize); ab „public“ gehört alles zur
                # Signatur, auch Parameter in eigener Zeile wie „@RequestBody XRequest request) {“
                kept_lines = []
                signature_started = False
                for signature_line in signature_lines:
                    if signature_line.startswith('public'):
                        signature_started = True
                    if signature_started or not signature_line.startswith('@'):
                        kept_lines.append(signature_line)
                signature = ' '.join(kept_lines)
                method_match = re.search(r'public\s+([\w<>, ?\[\]]+?)\s+(\w+)\s*\((.*)\)', signature)
                if method_match:
                    endpoints.append({
                        'controller': controller_name,
                        'path_file': path,
                        'http_method': MAPPING_METHODS[mapping_match.group(1)],
                        'url': base_path + sub_path,
                        'java_method': method_match.group(2),
                        'return_type': method_match.group(1),
                        'parameters': method_match.group(3),
                    })
                index = cursor
            index += 1
    return endpoints


def parse_backend_methods():
    """Je Java-Datei die Methoden (bzw. Record-Komponenten) mit ihrem Text, um Verwendungen zu finden."""
    methods_by_file = {}
    for path in list_files(BACKEND_DIR, ('.java',)):
        text = read_text(path)
        text_without_comments = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
        text_without_comments = re.sub(r'//[^\n]*', '', text_without_comments)
        lines = text_without_comments.split('\n')
        methods = []
        depth = 0
        current_method = None
        current_lines = []
        method_depth = None
        header = ''
        for line in lines:
            stripped = line.strip()
            if current_method is None and depth == 1:
                header = header + ' ' + stripped if header else stripped
                declaration = re.search(r'(?:public|protected|private|static|\s)*[\w<>, ?\[\]]+\s+(\w+)\s*\(', header)
                if declaration and declaration.group(1) not in CONTROL_KEYWORDS and ('{' in stripped or stripped.endswith(';')):
                    if '{' in stripped:
                        current_method = declaration.group(1)
                        current_lines = [header]
                        method_depth = depth
                    header = ''
                elif stripped.endswith(';') or stripped.endswith('}') or stripped == '' or stripped.startswith('@'):
                    header = '' if not stripped.startswith('@') else header
            elif current_method is not None:
                current_lines.append(stripped)
            depth += line.count('{') - line.count('}')
            if current_method is not None and depth <= method_depth:
                methods.append((current_method, ' '.join(current_lines)))
                current_method = None
                current_lines = []
        record_match = re.search(r'public\s+record\s+(\w+)\s*\((.*?)\)\s*\{', text_without_comments, re.S)
        if record_match:
            methods.append(('(Record-Komponenten)', record_match.group(2)))
        methods_by_file[path] = (methods, text_without_comments)
    return methods_by_file


def owner_entity_of_dto(dto_name, entity_names):
    """Ein DTO gehört zur längsten Entity, deren Name in seinem steckt (UsersContactForClient → UsersContact)."""
    matches = [entity_name for entity_name in entity_names if entity_name in dto_name and entity_name != dto_name]
    if not matches:
        return None
    return max(matches, key=len)


# --------------------------------------------------------------------------------------------------------- Frontend

def parse_frontend_types():
    """Wo im Frontend ein Typ definiert ist: export type <Name> = …"""
    definitions = {}
    for path in list_files(FRONTEND_DIR, ('.ts', '.tsx')):
        for match in re.finditer(r'^export type (\w+)\s*=', read_text(path), re.M):
            definitions.setdefault(match.group(1), path)
    return definitions


def frontend_usages(type_name, definition_path):
    usages = []
    pattern = re.compile(r'\b' + re.escape(type_name) + r'\b')
    for path in list_files(FRONTEND_DIR, ('.ts', '.tsx')):
        if path == definition_path:
            continue
        text = read_text(path)
        if not pattern.search(text):
            continue
        functions = []
        for function_match in re.finditer(r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*useCallback', text):
            name = function_match.group(1) or function_match.group(2)
            start = function_match.start()
            following = text[start:start + 4000]
            if pattern.search(following[:following.find('\n}\n') if '\n}\n' in following else len(following)]):
                functions.append(name)
        usages.append((path, list(dict.fromkeys(functions))))
    return usages


# ------------------------------------------------------------------------------------------------- Rückverweise

DOC_LINE_PREFIX = 'Doku:'


def add_java_doc_reference(path, kind, doc_paths):
    """Setzt im Klassen-Javadoc eine Zeile „Doku: …“ (ersetzt eine vorhandene)."""
    source_lines = read_text(path).split('\n')
    class_line_index = find_class_line(source_lines, kind)
    if class_line_index is None:
        return
    javadoc_lines, start_index, end_index = class_javadoc(source_lines, class_line_index)
    reference_text = ', '.join('{@code ' + doc_path + '}' for doc_path in doc_paths)
    reference_line = ' * ' + DOC_LINE_PREFIX + ' ' + reference_text + '.'
    if javadoc_lines is None:
        insert_index = class_line_index
        while insert_index > 0 and source_lines[insert_index - 1].strip().startswith('@'):
            insert_index -= 1
        source_lines[insert_index:insert_index] = ['/**', reference_line, ' */']
    elif start_index == end_index:
        # einzeiliges Javadoc /** … */: in einen Block mit der Doku-Zeile verwandeln
        single_line = source_lines[start_index].strip()
        inner_text = single_line[3:-2].strip()
        source_lines[start_index:start_index + 1] = ['/**', ' * ' + inner_text, ' * <p>', reference_line, ' */']
    else:
        existing_index = None
        for index in range(start_index, end_index + 1):
            if source_lines[index].strip().startswith('* ' + DOC_LINE_PREFIX):
                existing_index = index
        if existing_index is not None:
            source_lines[existing_index] = reference_line
        else:
            source_lines[end_index:end_index] = [' * <p>', reference_line]
    write_text(path, '\n'.join(source_lines))


def add_typescript_doc_reference(path, type_name, doc_path):
    lines = read_text(path).split('\n')
    pattern = re.compile(r'^export type ' + re.escape(type_name) + r'\s*=')
    for index, line in enumerate(lines):
        if not pattern.match(line):
            continue
        reference_line = ' * Doku: `' + doc_path + '`'
        if index > 0 and lines[index - 1].strip() == '*/':
            start = index - 1
            while start >= 0 and not lines[start].strip().startswith('/**'):
                start -= 1
            block = lines[start:index]
            if any(entry.strip() == reference_line.strip() for entry in block):
                return
            lines[index - 1:index - 1] = [reference_line]
        elif index > 0 and lines[index - 1].strip().startswith('/**') and lines[index - 1].strip().endswith('*/'):
            if doc_path in lines[index - 1]:
                return
            inner = lines[index - 1].strip()[3:-2].strip()
            lines[index - 1:index] = ['/**', ' * ' + inner, reference_line, ' */']
        else:
            lines[index:index] = ['/** Doku: `' + doc_path + '` */']
        write_text(path, '\n'.join(lines))
        return


# ------------------------------------------------------------------------------------------------------- Ausgabe

def code_link(path):
    return '[`' + os.path.relpath(path, PROJECT_DIR).replace(os.sep, '/') + '`](' + relative_link(ENTITY_DOCS_DIR, path) + ')'


def generate_entity_docs(extra_docs_by_controller=None):
    enums = parse_enums()
    entity_paths = {}
    embeddable_paths = {}
    for path in list_files(BACKEND_DIR, ('.java',)):
        text = read_text(path)
        if re.search(r'^@Entity', text, re.M):
            entity_paths[os.path.basename(path)[:-5]] = path
        if re.search(r'^@Embeddable', text, re.M):
            embeddable_paths[os.path.basename(path)[:-5]] = path
    embeddables = {name: parse_fields(read_text(path)) for name, path in embeddable_paths.items()}
    entity_names = sorted(entity_paths)
    endpoints = parse_controllers()
    methods_by_file = parse_backend_methods()
    frontend_types = parse_frontend_types()

    # DTOs und ihre Entity
    dto_owner = {}
    for path in list_files(BACKEND_DIR, ('.java',)):
        if os.sep + 'dto' + os.sep not in path:
            continue
        dto_name = os.path.basename(path)[:-5]
        owner = owner_entity_of_dto(dto_name, entity_names)
        if owner:
            dto_owner[dto_name] = owner

    # DTOs, die eine fremde Entity als Bestandteil tragen (z. B. SessionInfo mit Users): Ihre Endpunkte übertragen sie mit
    dtos_embedding_entity = {}
    for path in list_files(BACKEND_DIR, ('.java',)):
        if os.sep + 'dto' + os.sep not in path:
            continue
        dto_name = os.path.basename(path)[:-5]
        record_match = re.search(r'public\s+record\s+\w+\s*\((.*?)\)\s*(?:implements[^{]*)?\{', read_text(path), re.S)
        if not record_match:
            continue
        components_text = record_match.group(1)
        for embedded_entity_name in entity_names:
            if dto_owner.get(dto_name) == embedded_entity_name:
                continue
            if re.search(r'\b' + embedded_entity_name + r'\b', components_text):
                dtos_embedding_entity.setdefault(embedded_entity_name, []).append(dto_name)

    docs_by_controller = {}
    for entity_name in entity_names:
        path = entity_paths[entity_name]
        text = read_text(path)
        source_lines = text.split('\n')
        class_line_index = find_class_line(source_lines)
        javadoc_lines, _, _ = class_javadoc(source_lines, class_line_index)
        purpose = first_paragraph(clean_javadoc(javadoc_lines)) if javadoc_lines else ''
        table_match = re.search(r'@Table\(name\s*=\s*"([^"]+)"', text)
        table_name = table_match.group(1) if table_match else re.sub(r'(?<!^)(?=[A-Z])', '_', entity_name).lower()
        fields = parse_fields(text)
        example = build_example(fields, enums, embeddables)
        doc_rel = 'docu/entities/' + entity_name + '.md'

        # Endpunkte: die Signatur nennt die Entity oder ein DTO von ihr, oder der Controller ist ihrer
        own_dtos = [dto for dto, owner in dto_owner.items() if owner == entity_name]
        embedding_dtos = sorted(dtos_embedding_entity.get(entity_name, []))
        tokens = [entity_name] + own_dtos + embedding_dtos
        own_controller_names = {entity_name + suffix for suffix in ('Controller', 'AdminController', 'ShareController', 'FileManagerController')}
        entity_endpoints = []
        for endpoint in endpoints:
            signature = endpoint['return_type'] + ' ' + endpoint['parameters']
            transferred = [token for token in tokens if re.search(r'\b' + token + r'\b', signature)]
            if transferred or endpoint['controller'] in own_controller_names:
                entity_endpoints.append((endpoint, transferred))
                docs_by_controller.setdefault(endpoint['path_file'], set()).add(doc_rel)

        # Verwendung im Backend
        backend_usages = []
        token_pattern = re.compile(r'\b' + re.escape(entity_name) + r'\b')
        for java_path, (methods, whole_text) in methods_by_file.items():
            if java_path == path:
                continue
            if not token_pattern.search(whole_text):
                continue
            using_methods = [name for name, body in methods if token_pattern.search(body)]
            backend_usages.append((java_path, list(dict.fromkeys(using_methods))))

        # Frontend: der Typ der Entity und die Typen ihrer DTOs (z. B. UsersAchievementSummary zu UsersAchievement)
        type_path = frontend_types.get(entity_name)
        frontend_type_names = [entity_name] + [dto for dto in own_dtos if dto in frontend_types]
        typed_paths = []
        usages_by_path = {}
        for frontend_type_name in frontend_type_names:
            frontend_type_path = frontend_types.get(frontend_type_name)
            if frontend_type_path is None:
                continue
            typed_paths.append((frontend_type_name, frontend_type_path))
            for ts_path, functions in frontend_usages(frontend_type_name, frontend_type_path):
                merged_functions = usages_by_path.setdefault(ts_path, [])
                for function_name in functions:
                    if function_name not in merged_functions:
                        merged_functions.append(function_name)
        usages_frontend = sorted(usages_by_path.items())

        lines = ['# ' + entity_name, '']
        lines.append('> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Code. Nicht von Hand ändern: Code ändern und neu erzeugen.')
        lines.append('')
        if purpose:
            lines.append(purpose)
            lines.append('')
        lines.append('- **Tabelle:** `' + table_name + '`')
        lines.append('- **Klasse:** ' + code_link(path))
        if type_path:
            lines.append('- **Frontend-Typ:** ' + code_link(type_path))
        if own_dtos:
            lines.append('- **DTOs:** ' + ', '.join('`' + dto + '`' for dto in sorted(own_dtos)))
        if embedding_dtos:
            lines.append('- **Steckt in:** ' + ', '.join('`' + dto + '`' for dto in embedding_dtos))
        lines.append('')
        lines.append('## Beispiel-JSON')
        lines.append('')
        lines.append('Aus den Feldern mit Getter; die Werte sind erfunden. Geheimes (Passwort, Schlüssel, Token) kommt nie ins JSON.')
        lines.append('')
        lines.append('```json')
        lines.append(json.dumps(example, ensure_ascii=False, indent=2))
        lines.append('```')
        lines.append('')
        lines.append('## Felder')
        lines.append('')
        lines.append('| Feld | Typ | Spalte | im JSON | Bedeutung |')
        lines.append('|---|---|---|---|---|')
        for field in fields:
            in_json = 'ja' if field['has_getter'] and not field['json_ignore'] and not is_sensitive(field['name']) else 'nein'
            comment = field['comment'].replace('|', '\\|')
            lines.append('| `' + field['name'] + '` | `' + field['type'] + '` | ' + column_info(field) + ' | ' + in_json + ' | ' + comment + ' |')
        lines.append('')
        lines.append('## Endpunkte')
        lines.append('')
        if entity_endpoints:
            lines.append('| Methode | Pfad | Controller | überträgt |')
            lines.append('|---|---|---|---|')
            for endpoint, transferred in entity_endpoints:
                transferred_text = ', '.join('`' + token + '`' for token in transferred) if transferred else '(eigener Controller)'
                controller_text = '[`' + endpoint['controller'] + '.' + endpoint['java_method'] + '`](' + relative_link(ENTITY_DOCS_DIR, endpoint['path_file']) + ')'
                lines.append('| ' + endpoint['http_method'] + ' | `' + endpoint['url'] + '` | ' + controller_text + ' | ' + transferred_text + ' |')
        else:
            lines.append('Keine: Die Entity wird nur im Backend benutzt.')
        lines.append('')
        lines.append('## Verwendung im Backend')
        lines.append('')
        for java_path, using_methods in sorted(backend_usages):
            methods_text = ', '.join('`' + name + '`' for name in using_methods) if using_methods else '(Import, Felder)'
            lines.append('- ' + code_link(java_path) + ': ' + methods_text)
        if not backend_usages:
            lines.append('Nur in der eigenen Klasse.')
        lines.append('')
        lines.append('## Verwendung im Frontend')
        lines.append('')
        if usages_frontend:
            for ts_path, functions in usages_frontend:
                functions_text = ', '.join('`' + name + '`' for name in functions) if functions else '(Typ)'
                lines.append('- ' + code_link(ts_path) + ': ' + functions_text)
        elif typed_paths:
            lines.append('Nur der Typ selbst.')
        else:
            lines.append('Keine: Das Frontend kennt die Entity nicht.')
        lines.append('')
        write_text(os.path.join(ENTITY_DOCS_DIR, entity_name + '.md'), '\n'.join(lines))

        # Rückverweise
        add_java_doc_reference(path, 'class', [doc_rel])
        for frontend_type_name, frontend_type_path in typed_paths:
            add_typescript_doc_reference(frontend_type_path, frontend_type_name, doc_rel)

    for controller_path, extra_doc_paths in (extra_docs_by_controller or {}).items():
        docs_by_controller.setdefault(controller_path, set()).update(extra_doc_paths)
    for controller_path, doc_paths in docs_by_controller.items():
        add_java_doc_reference(controller_path, 'class', sorted(doc_paths))

    readme = ['# Entities', '']
    readme.append('Je Entity eine Doku (Regel des Nutzers vom 2026-11-09): Zweck, Tabelle, Beispiel-JSON, Felder, alle Endpunkte,')
    readme.append('die sie oder ihre DTOs übertragen, und alle Methoden in Backend und Frontend, die sie benutzen. Der Code verweist')
    readme.append('zurück (Javadoc der Entity und der Controller, Kommentar am Frontend-Typ). Erzeugt mit')
    readme.append('`python3 docu/tools/generate_entity_docs.py`; nach jeder Änderung neu erzeugen.')
    readme.append('')
    for entity_name in entity_names:
        purpose = ''
        lines_of_entity = read_text(entity_paths[entity_name]).split('\n')
        javadoc_lines, _, _ = class_javadoc(lines_of_entity, find_class_line(lines_of_entity))
        if javadoc_lines:
            purpose = first_paragraph(clean_javadoc(javadoc_lines))
            purpose = purpose.split('. ')[0].rstrip('.') + '.'
        readme.append('- [' + entity_name + '](' + entity_name + '.md): ' + purpose)
    readme.append('')
    write_text(os.path.join(ENTITY_DOCS_DIR, 'README.md'), '\n'.join(readme))
    return entity_names


# Welche Endpunkte zu einem Solr-Kern gehören: Pfad oder Signatur passen zum Muster des Kerns
SOLR_CORE_ENDPOINT_PATTERNS = {'FILE': r'file-document|\bFile(?:Document|Upload)\w*'}


def generate_solr_core_doc(solr_core_key, export_path, endpoints):
    """Doku eines Solr-Kerns: Felder, Beispiel-Dokument, Endpunkte. Liefert die Controller, die auf ihn verweisen sollen."""
    export = json.loads(read_text(export_path))
    fields = sorted(export['solrFields'], key=lambda field: field.get('listingPosition', 0))
    lines = ['# Solr-Kern ' + solr_core_key, '']
    lines.append('> Erzeugt von `docu/tools/generate_entity_docs.py` aus dem Export vom ' + export['exportedAt'] + ' (' + str(len(export['documents'])) + ' Dokumente). Die Felder stehen in Postgres (`solr_field`, Solr-Manager).')
    lines.append('')
    lines.append('| Pos. | Feld | Typ | indexiert | gespeichert | mehrwertig | docValues | Pflicht | Suggest | NGram | vom Client | Suchgewicht | lesen ab | Anzeigename | Beschreibung |')
    lines.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    def flag(value):
        return 'ja' if value else ''
    for field in fields:
        display_name = (field.get('displayName') or {}).get('de', '')
        description = ((field.get('description') or {}).get('de', '') or '').replace('|', '\\|').replace('\n', ' ')
        reader = field.get('readerAccessRoleKey') or '(nur Backend)'
        lines.append('| ' + str(field.get('listingPosition')) + ' | `' + field['name'] + '` | ' + field['type'] + ' | ' + flag(field.get('indexed')) + ' | ' + flag(field.get('stored')) + ' | ' + flag(field.get('multiValued')) + ' | ' + flag(field.get('docValues')) + ' | ' + flag(field.get('required')) + ' | ' + flag(field.get('suggestTwin')) + ' | ' + flag(field.get('ngramTwin')) + ' | ' + flag(field.get('clientValueAccepted')) + ' | ' + str(field.get('searchWeight')) + ' | ' + reader + ' | ' + display_name + ' | ' + description + ' |')
    lines.append('')
    if export['documents']:
        lines.append('## Beispiel-Dokument')
        lines.append('')
        lines.append('Das erste Dokument des Exports, lange Werte gekürzt:')
        lines.append('')
        sample = OrderedDict()
        for key, value in export['documents'][0].items():
            if isinstance(value, str) and len(value) > 80:
                value = value[:60] + '…'
            sample[key] = value
        lines.append('```json')
        lines.append(json.dumps(sample, ensure_ascii=False, indent=2))
        lines.append('```')
        lines.append('')
    controller_paths = set()
    endpoint_pattern_text = SOLR_CORE_ENDPOINT_PATTERNS.get(solr_core_key)
    if endpoint_pattern_text is not None:
        endpoint_pattern = re.compile(endpoint_pattern_text)
        core_endpoints = []
        for endpoint in endpoints:
            signature = endpoint['return_type'] + ' ' + endpoint['parameters']
            if endpoint_pattern.search(endpoint['url']) or endpoint_pattern.search(signature):
                core_endpoints.append(endpoint)
                controller_paths.add(endpoint['path_file'])
        lines.append('## Endpunkte')
        lines.append('')
        lines.append('Alle Endpunkte, deren Pfad oder Signatur zum Kern gehört (Muster `' + endpoint_pattern_text + '`).')
        lines.append('')
        lines.append('| Methode | Pfad | Controller |')
        lines.append('|---|---|---|')
        for endpoint in core_endpoints:
            controller_name = endpoint['controller'] + '.' + endpoint['java_method']
            controller_text = '[`' + controller_name + '`](' + relative_link(SOLR_CORE_DOCS_DIR, endpoint['path_file']) + ')'
            lines.append('| ' + endpoint['http_method'] + ' | `' + endpoint['url'] + '` | ' + controller_text + ' |')
        lines.append('')
    write_text(os.path.join(SOLR_CORE_DOCS_DIR, solr_core_key + '.md'), '\n'.join(lines))
    return controller_paths


def main():
    parser = argparse.ArgumentParser(description='Doku je Entity und je Solr-Kern erzeugen')
    parser.add_argument('--solr-export', action='append', default=[], help='KERN=/pfad/zum/export.json')
    arguments = parser.parse_args()
    # Erst die Kerne: Ihre Controller bekommen den Verweis zusammen mit denen auf Entities
    endpoints = parse_controllers()
    extra_docs_by_controller = {}
    for solr_export in arguments.solr_export:
        solr_core_key, export_path = solr_export.split('=', 1)
        controller_paths = generate_solr_core_doc(solr_core_key, export_path, endpoints)
        solr_core_doc_rel = 'docu/solr-cores/' + solr_core_key + '.md'
        for controller_path in controller_paths:
            extra_docs_by_controller.setdefault(controller_path, set()).add(solr_core_doc_rel)
        print('Solr-Kern:', solr_core_key, '(' + str(len(controller_paths)) + ' Controller)')
    entity_names = generate_entity_docs(extra_docs_by_controller)
    print('Entities:', len(entity_names))


if __name__ == '__main__':
    main()
