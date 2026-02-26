import { Plugin, Notice } from 'obsidian';
import { updateNoteLinks } from './commands/note_update';
import { updateAllLinks } from './commands/all_note_update';
import { createNewEvent } from './commands/new_event';
import { addRelative } from './commands/add_relative';
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
        } catch (error) {
          new Notice('Ошибка при обновлении ссылок');
          console.error(error);
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
            } catch (error) {
              new Notice('Ошибка при обновлении хранилища');
              console.error(error);
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
        } catch (error) {
          new Notice('Ошибка при создании');
          console.error(error);
        }
      },
    });

    this.addCommand({
      id: 'add-relative-note',
      name: 'Добавить родственника к текущей заметке',
      callback: async () => {
        try {
          await addRelative(this);
        } catch (error) {
          new Notice('Ошибка при добавлении родственника');
          console.error(error);
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
