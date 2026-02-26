import { App, Modal } from 'obsidian';

export class ConfirmationModal extends Modal {
  private message: string;
  private action: () => Promise<void>;

  constructor(app: App, message: string, action: () => Promise<void>) {
    super(app);
    this.message = message;
    this.action = action;
  }

  onOpen(): void {
    const { contentEl } = this;

    this.modalEl.addClass('confirm-modal');
    contentEl.createEl('p', { text: this.message });

    const buttonContainer = contentEl.createDiv('modal-button-container');

    buttonContainer
      .createEl('button', { text: 'Отмена' })
      .addEventListener('click', () => this.close());

    const confirmBtn = buttonContainer.createEl('button', {
      attr: { type: 'submit' },
      cls: 'mod-cta',
      text: 'Подтвердить',
    });

    confirmBtn.addEventListener('click', async () => {
      this.close();
      await this.action();
    });

    setTimeout(() => confirmBtn.focus(), 50);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class ChoiceModal extends Modal {
  private choices: string[];
  private onSubmit: (choice: string) => void;

  constructor(app: App, choices: string[], onSubmit: (choice: string) => void) {
    super(app);
    this.choices = choices;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: 'Выберите действие' });

    const listContainer = contentEl.createDiv('choice-list');

    this.choices.forEach((choice) => {
      const button = listContainer.createEl('button', {
        text: choice,
        cls: 'mod-cta',
      });
      button.style.margin = '5px';
      button.style.width = '100%';

      button.addEventListener('click', () => {
        this.close();
        this.onSubmit(choice);
      });
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export class PromptModal extends Modal {
  private promptText: string;
  private onSubmit: (result: string) => void;

  constructor(app: App, promptText: string, onSubmit: (result: string) => void) {
    super(app);
    this.promptText = promptText;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl('h3', { text: this.promptText });

    const input = contentEl.createEl('input', { type: 'text' });
    input.style.width = '100%';
    input.style.marginBottom = '10px';

    const submitBtn = contentEl.createEl('button', {
      text: 'Подтвердить',
      cls: 'mod-cta',
    });

    submitBtn.addEventListener('click', () => {
      if (input.value.trim() !== '') {
        this.close();
        this.onSubmit(input.value.trim());
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim() !== '') {
        this.close();
        this.onSubmit(input.value.trim());
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
