import os
import re

def clean_catalog(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove TipoPermiso from import
    content = re.sub(r', TipoPermiso', '', content)
    content = re.sub(r'TipoPermiso, ', '', content)
    content = re.sub(r'from \.base import TipoPermiso\n', '', content)
    
    # Remove tipo lines
    # Matches patterns like: "tipo": TipoPermiso.LECTURA,
    lines = content.split('\n')
    new_lines = [line for line in lines if '"tipo": TipoPermiso.' not in line]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

path = 'backend/src/constants/empresa_permisos'
files = [f for f in os.listdir(path) if f.startswith('catalog_')]
for filename in files:
    clean_catalog(os.path.join(path, filename))
    print(f"Cleaned {filename}")
