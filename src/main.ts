import { Plugin, Notice } from 'obsidian';
import { updateNoteLinks } from './commands/note_update';
import { updateAllLinks } from './commands/all_note_update';
import { createNewEvent } from './commands/new_event';
import { openOrCreateFather, createChild, createBrother } from './commands/add_relative';
import { ConfirmationModal } from './ui/modal';
import { PeriodicNotesSettingTab, DEFAULT_SETTINGS, PluginSettings } from './settings/settings';

export default class PeriodicNotesPlugin extends Plugin {
  settings!: PluginSettings;

  async onload(): Promise<void> {
    console.log('Загрузка Periodic Notes Linker');

    await this.loadSettings();
    this.addSettingTab(new PeriodicNotesSettingTab(this.app, this));

    this.addCommand({
      id: 'update-links-of-note',
      name: 'Обновить ссылки заметки',
      callback: async () => {
        new Notice('Начато обновление ссылок заметки');
        try {
          await updateNoteLinks(this);
          new Notice('Обновление ссылок заметки закончено');
        } catch {
          new Notice('Ошибка при обновлении ссылок');
        }
      },
    });

    this.addCommand({
      id: 'update-links-of-vault',
      name: 'Обновить ссылки хранилища',
      callback: async () => {
        new ConfirmationModal(
          this.app,
          'Это действие обновит ссылки во всех файлах. Вы уверены?',
          async () => {
            new Notice('Начато обновление ссылок хранилища');
            try {
              await updateAllLinks(this);
              new Notice('Обновление ссылок хранилища закончено');
            } catch {
              new Notice('Ошибка при обновлении хранилища');
            }
          }
        ).open();
      },
    });

    this.addCommand({
      id: 'create-new-periodic',
      name: 'Создать новое периодическое событие',
      callback: async () => {
        new Notice('Создание начато');
        try {
          await createNewEvent(this);
          new Notice('Создание закончено');
        } catch {
          new Notice('Ошибка при создании');
        }
      },
    });

    this.addCommand({
      id: 'open-create-father-note',
      name: 'Открыть/Создать отца для текущей заметки',
      callback: async () => {
        try {
          await openOrCreateFather(this);
        } catch {
          new Notice('Ошибка при обработке отца');
        }
      },
    });

    this.addCommand({
      id: 'create-child-note',
      name: 'Создать ребёнка для текущей заметки',
      callback: async () => {
        try {
          await createChild(this);
        } catch {
          new Notice('Ошибка при создании ребёнка');
        }
      },
    });

    this.addCommand({
      id: 'create-brother-note',
      name: 'Создать брата для текущей заметки',
      callback: async () => {
        try {
          await createBrother(this);
        } catch {
          new Notice('Ошибка при создании брата');
        }
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  onunload(): void {
    console.log('Выгрузка Periodic Notes Linker');
  }
}
