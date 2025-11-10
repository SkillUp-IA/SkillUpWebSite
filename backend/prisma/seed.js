import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';

const prisma = new PrismaClient();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  const file = path.join(__dirname, 'data', 'profiles.json');
  const json = await fs.readFile(file, 'utf-8');
  const items = JSON.parse(json);

  console.log(`Seeding ${items.length} profiles...`);

  for (const p of items) {
    await prisma.profile.create({
      data: {
        nome: p.nome,
        foto: p.foto,
        cargo: p.cargo,
        resumo: p.resumo,
        localizacao: p.localizacao,
        area: p.area,
        habilidadesTecnicas: p.habilidadesTecnicas,
        softSkills: p.softSkills,
        experiencias: p.experiencias,
        formacao: p.formacao,
        projetos: p.projetos,
        certificacoes: p.certificacoes,
        idiomas: p.idiomas,
        areasInteresses: p.areasInteresses
      }
    });
  }

  console.log('Seed concluído ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
