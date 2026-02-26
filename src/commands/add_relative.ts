import { Notice, Plugin, TFile } from 'obsidian';
import { PluginSettings } from '../settings/settings';
import { Updater } from '../utils/services/updater';
import { Repo, IGraph } from '../repository/repo';
import { ChoiceModal, PromptModal } from '../ui/modal';

interface ObsidianPlugin extends Plugin {
  settings: PluginSettings;
}

export async function addRelative(plugin: ObsidianPlugin): Promise<void> {
  const file = plugin.app.workspace.getActiveFile();
  if (!file) {
    new Notice('Нет активного файла');
    return;
  }

  const words = file.basename.split('.');
  const folderPath = file.parent && file.parent.path !== '/' ? `${file.parent.path}/` : '';

  new ChoiceModal(
    plugin.app,
    ['Открыть/Создать отца', 'Создать ребёнка', 'Создать брата'],
    async (action) => {
      if (action === 'Открыть/Создать отца') {
        if (words.length <= 1) {
          new Notice('У этой заметки не может быть отца (она корневая)');
          return;
        }

        const fatherName = words.slice(0, -1).join('.');
        const fatherPath = `${folderPath}${fatherName}.md`;

        try {
          let fatherFile = plugin.app.vault.getAbstractFileByPath(fatherPath);

          if (!fatherFile) {
            const fatherTitle = words[words.length - 2] ?? fatherName;
            fatherFile = await plugin.app.vault.create(fatherPath, `# ${fatherTitle}\n`);
            await updateAndOpen(plugin, fatherFile as TFile, fatherName, 'отец');
          } else if (fatherFile instanceof TFile) {
            await plugin.app.workspace.getLeaf(false).openFile(fatherFile);
            new Notice(`Отец открыт: ${fatherName}`);
          }
        } catch {
          new Notice('Ошибка при поиске или создании отца');
        }
      } else if (action === 'Создать ребёнка') {
        new PromptModal(plugin.app, 'Введите имя ребёнка:', async (inputName) => {
          const newName = `${file.basename}.${inputName}`;
          const newPath = `${folderPath}${newName}.md`;

          try {
            const newFile = await plugin.app.vault.create(newPath, `# ${inputName}\n`);
            await updateAndOpen(plugin, newFile, newName, 'ребёнок');
          } catch {
            new Notice('Ошибка создания файла');
          }
        }).open();
      } else if (action === 'Создать брата') {
        if (words.length <= 1) {
          new Notice('У корневой заметки не может быть брата таким способом');
          return;
        }

        new PromptModal(plugin.app, 'Введите имя брата:', async (inputName) => {
          const fatherName = words.slice(0, -1).join('.');
          const newName = `${fatherName}.${inputName}`;
          const newPath = `${folderPath}${newName}.md`;

          try {
            const currentText = await plugin.app.vault.read(file);
            const headers = currentText
              .split('\n')
              .filter((line) => line.startsWith('#'))
              .join('\n');

            const currentTitle = words[words.length - 1];
            const initialContent = headers
              ? headers.replace(new RegExp(`# ${currentTitle}`, 'g'), `# ${inputName}`)
              : `# ${inputName}\n`;

            const newFile = await plugin.app.vault.create(newPath, initialContent);
            await updateAndOpen(plugin, newFile, newName, 'брат');
          } catch {
            new Notice('Ошибка создания брата');
          }
        }).open();
      }
    }
  ).open();
}

async function updateAndOpen(plugin: ObsidianPlugin, file: TFile, name: string, type: string) {
  const allFiles = plugin.app.vault.getMarkdownFiles();
  const voidFiles = allFiles.filter((f: TFile) => f.path.startsWith(plugin.settings.paths.void));
  const celestiaFiles = allFiles.filter((f: TFile) =>
    f.path.startsWith(plugin.settings.paths.celestia)
  );

  const repository = new Repo(plugin);
  const VOID = repository.createGraph(
    voidFiles,
    plugin.settings.paths.void,
    plugin.settings.aliases.void
  );
  const CELESTIA = repository.createGraph(
    celestiaFiles,
    plugin.settings.paths.celestia,
    plugin.settings.aliases.celestia
  );

  let targetGraph: IGraph | null = null;
  if (file.path.includes(plugin.settings.paths.void)) {
    targetGraph = VOID;
  } else if (file.path.includes(plugin.settings.paths.celestia)) {
    targetGraph = CELESTIA;
  }

  if (targetGraph) {
    const updater = new Updater(plugin);
    await updater.update(file, targetGraph, CELESTIA);
  }

  await plugin.app.workspace.getLeaf(false).openFile(file);
  new Notice(`Создан и обновлён ${type}: ${name}`);
}
