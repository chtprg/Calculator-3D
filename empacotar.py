#!/usr/bin/env python3
"""Gera caderninho.zip só com o app, pronto para arrastar na aba Deploys do Netlify."""
import pathlib, zipfile

raiz = pathlib.Path(__file__).parent
entra = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'fonts', 'logos', 'icones']
fora = {'molde.html', 'gerar.js'}

with zipfile.ZipFile(raiz / 'caderninho.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for item in entra:
        p = raiz / item
        for arq in ([p] if p.is_file() else sorted(p.rglob('*'))):
            if arq.is_file() and arq.name not in fora:
                z.write(arq, arq.relative_to(raiz))
print('caderninho.zip pronto.')
