import { Notice, Plugin, TFile, Modal } from 'obsidian';
import { PluginSettings } from '../settings/settings';
import { Updater } from '../utils/services/updater';
import { Repo } from '../repository/repo';

interface ObsidianPlugin extends Plugin {
  settings: PluginSettings;
}

interface PluginManager {
  plugins: {
    templater?: {
      templater: {
        current_functions_object: {
          system: {
            suggester: (options: string[], values: string[]) => Promise<string | undefined>;
          };
        };
      };
    };
  };
}

class EventTypeModal extends Modal {
  private eventTypes: string[];
  private onSubmit: (eventType: string) => void;

  constructor(app: any, eventTypes: string[], onSubmit: (eventType: string) => void) {
    super(app);
    this.eventTypes = eventTypes;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Выберите тип события' });

    const listContainer = contentEl.createDiv('event-type-list');
    this.eventTypes.forEach((type) => {
      const button = listContainer.createEl('button', {
        text: type,
        cls: 'event-type-button',
      });

      button.addEventListener('click', () => {
        this.close();
        this.onSubmit(type);
      });
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export async function createNewEvent(plugin: ObsidianPlugin): Promise<void> {
  const file = plugin.app.workspace.getActiveFile();
  if (!file) {
    new Notice('Нет активного файла');
    return;
  }

  const title = file.basename;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(title)) {
    new Notice('Заметка не является ежедневной');
    return;
  }

  const allFiles = plugin.app.vault.getMarkdownFiles();
  const voidFiles = allFiles.filter((file: TFile) =>
    file.path.startsWith(plugin.settings.paths.void)
  );
  const celestiaFiles = allFiles.filter((file: TFile) =>
    file.path.startsWith(plugin.settings.paths.celestia)
  );

  // Выбор типа события
  let eventType: string | undefined;
  const pluginManager = (plugin.app as any).plugins as PluginManager;
  if (pluginManager.plugins.templater) {
    // Используем Templater suggester если доступен
    eventType =
      await pluginManager.plugins.templater.templater.current_functions_object.system.suggester(
        plugin.settings.event.types,
        plugin.settings.event.types
      );
  } else {
    // Используем собственное модальное окно
    eventType = await new Promise<string>((resolve) => {
      new EventTypeModal(plugin.app, plugin.settings.event.types, (selected) => {
        resolve(selected);
      }).open();
    });
  }

  if (!eventType) return;

  const eventPrefix = eventType.charAt(0).toLowerCase() + eventType.slice(1);

  // Строго фильтруем файлы, чтобы они оканчивались на <N...
  const eventFiles = voidFiles.filter((file: TFile) =>
    file.basename.startsWith(`${eventPrefix}.${title}.<N`)
  );

  let maxNumber = 0;
  eventFiles.forEach((file: TFile) => {
    // Извлекаем цифры после <N (сработает и для 1, и для 01)
    const match = file.basename.match(/<N(\d+)>/);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number > maxNumber) maxNumber = number;
    }
  });

  // Добавляем ведущий ноль, чтобы всегда было минимум 2 цифры
  const nextNumberStr = String(maxNumber + 1).padStart(2, '0');

  const newFileName = `${plugin.settings.paths.void}${eventPrefix}.${title}.<N${nextNumberStr}>.md`;

  try {
    // Создаем файл
    const createdFile = await plugin.app.vault.create(newFileName, '');
    new Notice(`Создан: ${eventPrefix}.<N${nextNumberStr}>`);

    // Обновляем графы
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

    // Добавляем новый файл в граф
    VOID.files.push(createdFile);
    VOID.files.sort((a, b) => a.basename.localeCompare(b.basename));

    // Обновляем содержимое нового файла
    const updater = new Updater(plugin);
    await updater.update(createdFile, VOID, CELESTIA);

    new Notice(`Обновлено: ${eventPrefix}.<N${nextNumberStr}>`);
  } catch (error) {
    console.error(`Ошибка создания: ${error}`);
    new Notice('Ошибка при создании файла');
  }
}
