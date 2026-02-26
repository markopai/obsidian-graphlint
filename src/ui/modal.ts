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
    this.modalEl.addClass('custom-unified-modal');

    contentEl.createEl('h2', { text: 'Подтверждение' });
    contentEl.createEl('p', { text: this.message });

    const buttonContainer = contentEl.createDiv('modal-button-container');

    const cancelBtn = buttonContainer.createEl('button', { text: 'Отмена' });
    cancelBtn.addEventListener('click', () => this.close());

    const confirmBtn = buttonContainer.createEl('button', {
      attr: { type: 'submit' },
      cls: 'mod-cta',
      text: 'Подтвердить',
    });

    confirmBtn.addEventListener('click', async () => {
      this.close();
      await this.action();
    });

    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (document.activeElement === confirmBtn) {
          cancelBtn.focus();
        } else {
          confirmBtn.focus();
        }
      }
    });

    setTimeout(() => confirmBtn.focus(), 50);
  }

  onClose(): void {
    this.contentEl.empty();
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
    this.modalEl.addClass('custom-unified-modal');

    contentEl.createEl('h2', { text: 'Выберите действие' });

    const listContainer = contentEl.createDiv('choice-list-container');
    const buttons: HTMLButtonElement[] = [];

    this.choices.forEach((choice) => {
      const button = listContainer.createEl('button', {
        text: choice,
        cls: 'mod-cta',
      });

      button.addEventListener('click', () => {
        this.close();
        this.onSubmit(choice);
      });

      buttons.push(button);
    });

    let currentIndex = 0;

    contentEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % buttons.length;
        buttons[currentIndex].focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[currentIndex].focus();
      }
    });

    setTimeout(() => buttons[0]?.focus(), 50);
  }

  onClose(): void {
    this.contentEl.empty();
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
    this.modalEl.addClass('custom-unified-modal');

    contentEl.createEl('h2', { text: this.promptText });

    const inputContainer = contentEl.createDiv('prompt-input-container');
    const input = inputContainer.createEl('input', { type: 'text', cls: 'prompt-input' });

    const buttonContainer = contentEl.createDiv('modal-button-container');

    const cancelBtn = buttonContainer.createEl('button', { text: 'Отмена' });
    cancelBtn.addEventListener('click', () => this.close());

    const submitBtn = buttonContainer.createEl('button', {
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
        e.preventDefault();
        this.close();
        this.onSubmit(input.value.trim());
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
