"""
Lightweight, zero-dependency streaming .xlsx reader using Python stdlib
(zipfile + xml.etree.ElementTree.iterparse).
"""
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Iterator, List, Optional

NS_MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
TAG_SI = f'{{{NS_MAIN}}}si'
TAG_T = f'{{{NS_MAIN}}}t'
TAG_ROW = f'{{{NS_MAIN}}}row'
TAG_C = f'{{{NS_MAIN}}}c'
TAG_V = f'{{{NS_MAIN}}}v'
TAG_IS = f'{{{NS_MAIN}}}is'
TAG_SHEET = f'{{{NS_MAIN}}}sheet'


def _col_ref_to_index(cell_ref: str) -> int:
    """Convert Excel column reference like 'AB12' to 0-based column index."""
    idx = 0
    for ch in cell_ref:
        if 'A' <= ch <= 'Z':
            idx = idx * 26 + (ord(ch) - ord('A') + 1)
        elif 'a' <= ch <= 'z':
            idx = idx * 26 + (ord(ch) - ord('a') + 1)
        else:
            break
    return max(idx - 1, 0)


def _load_shared_strings(zf: zipfile.ZipFile) -> List[str]:
    """Load shared string table from xl/sharedStrings.xml."""
    if 'xl/sharedStrings.xml' not in zf.namelist():
        return []
    strings: List[str] = []
    with zf.open('xl/sharedStrings.xml') as fh:
        for event, elem in ET.iterparse(fh, events=('end',)):
            if elem.tag == TAG_SI:
                parts = [t.text or '' for t in elem.iter(TAG_T)]
                strings.append(''.join(parts))
                elem.clear()
    return strings


def _get_sheet_paths(zf: zipfile.ZipFile) -> List[tuple]:
    """Return list of (sheet_name, zip_member_path) in workbook order."""
    names: List[str] = []
    if 'xl/workbook.xml' in zf.namelist():
        wb = ET.fromstring(zf.read('xl/workbook.xml'))
        names = [s.attrib.get('name', f'Sheet{i+1}') for i, s in enumerate(wb.iter(TAG_SHEET))]

    sheet_files = sorted(
        [n for n in zf.namelist() if n.startswith('xl/worksheets/sheet') and n.endswith('.xml')],
        key=lambda s: int(''.join(c for c in s.rsplit('/', 1)[-1] if c.isdigit()) or 0),
    )
    result = []
    for i, path in enumerate(sheet_files):
        name = names[i] if i < len(names) else f'Sheet{i+1}'
        result.append((name, path))
    return result


def iter_xlsx_dicts(
    file_path: str,
    sheet_index: int = 0,
) -> Iterator[Dict[str, str]]:
    """
    Stream rows from an .xlsx worksheet as dicts keyed by stripped header names.
    Skips completely empty rows.
    """
    with zipfile.ZipFile(file_path, 'r') as zf:
        shared_strings = _load_shared_strings(zf)
        sheets = _get_sheet_paths(zf)
        if sheet_index >= len(sheets):
            return
        _, sheet_path = sheets[sheet_index]

        headers: Optional[Dict[int, str]] = None
        with zf.open(sheet_path) as fh:
            for event, elem in ET.iterparse(fh, events=('end',)):
                if elem.tag != TAG_ROW:
                    continue

                row_values: Dict[int, str] = {}
                col_fallback = 0
                for c in elem:
                    if c.tag != TAG_C:
                        continue
                    ref = c.attrib.get('r', '')
                    col_idx = _col_ref_to_index(ref) if ref else col_fallback
                    col_fallback = col_idx + 1

                    cell_type = c.attrib.get('t', '')
                    val = ''
                    if cell_type == 's':
                        v = c.find(TAG_V)
                        if v is not None and v.text is not None:
                            s_idx = int(v.text)
                            if 0 <= s_idx < len(shared_strings):
                                val = shared_strings[s_idx]
                    elif cell_type == 'inlineStr':
                        is_el = c.find(TAG_IS)
                        if is_el is not None:
                            val = ''.join(t.text or '' for t in is_el.iter(TAG_T))
                    else:
                        v = c.find(TAG_V)
                        if v is not None and v.text is not None:
                            val = v.text

                    row_values[col_idx] = val.strip()

                elem.clear()

                if not any(row_values.values()):
                    continue

                if headers is None:
                    headers = {idx: h.strip() for idx, h in row_values.items() if h.strip()}
                    continue

                record = {
                    header_name: row_values.get(col_idx, '')
                    for col_idx, header_name in headers.items()
                }
                if any(record.values()):
                    yield record
