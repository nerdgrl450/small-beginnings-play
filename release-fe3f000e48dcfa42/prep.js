import { batchProblem, batchRequirements, BATCH_SIZES, ingredients, recipes } from './engine.js';
import { icon } from './icons.js';

const steps = [
  { label: 'Squeeze lemons', short: 'Squeeze', icon: 'lemon', scene: 'Fresh lemons on the counter' },
  { label: 'Stir in sugar', short: 'Stir', icon: 'sparkle', scene: 'Juice squeezed' },
  { label: 'Add water & pour', short: 'Pour', icon: 'drop', scene: 'Sugar stirred in' },
];

function choice(type, value, label, selected) {
  return `<button type="button" data-prep="${type}" data-value="${value}" aria-pressed="${selected}">${label}</button>`;
}

export function setupPrep({ getState, make, goMarket, onClose }) {
  const dialog = document.getElementById('prep-dialog');
  const content = document.getElementById('prep-content');
  let recipe = 'balanced';
  let servings = 12;
  let step = 0;
  let saving = false;
  let message = '';

  function reset() {
    step = 0;
    message = '';
  }

  function render(focus) {
    const state = getState();
    if (!state) return;
    const requirements = batchRequirements(recipe, servings);
    const problem = batchProblem(state, recipe, servings);
    const complete = step === steps.length;
    const current = steps[step];
    content.innerHTML = `<div class="prep-art" data-stage="${step}">
      <img src="./art/lemonade-prep${complete ? '' : '-empty'}.webp" alt="Lemons, a glass pitcher, a bowl of sugar, and paper cups on a wooden counter.">
      <span class="prep-art-caption" aria-live="polite">${complete ? 'Fresh pitcher ready' : current.scene}</span>
    </div>
    ${complete ? `<div class="prep-done" role="status"><span>${icon('check')}</span><div><strong>${servings} cups ready to sell</strong><p>${recipes[recipe].name} lemonade</p></div></div>` : `
      <div class="prep-options">
        <fieldset><legend>Recipe</legend><div class="prep-options-row">${Object.entries(recipes).map(([id, item]) => choice('recipe', id, item.name, id === recipe)).join('')}</div></fieldset>
        <p class="prep-note">${recipes[recipe].note}</p>
        <fieldset><legend>Batch size <span>cups</span></legend><div class="prep-options-row">${BATCH_SIZES.map((size) => choice('size', size, size, size === servings)).join('')}</div></fieldset>
      </div>
      <ul class="prep-ingredients" aria-label="Required ingredients and pantry stock">${Object.entries(ingredients).map(([id, item]) =>
        `<li class="${state.pantry[id] < requirements[id] ? 'short' : ''}">${icon(item.icon)}<span>${id === 'cups' ? 'Cups' : item.name}</span><strong>${requirements[id]} <small>/ ${state.pantry[id]}</small></strong></li>`).join('')}</ul>
      <ol class="prep-steps" aria-label="Preparation steps">${steps.map((item, index) => `<li ${index === step ? 'aria-current="step"' : ''}>${icon(index < step ? 'check' : item.icon)}${item.short}</li>`).join('')}</ol>
      ${problem || message ? `<p class="prep-problem" role="status">${message || problem}</p>` : ''}`}
    <div class="prep-actions">
      ${complete ? `<button class="button primary" type="button" data-prep="close">${icon('check')} Back to stand</button>
        <button class="button secondary" type="button" data-prep="repeat">Make another batch</button>` : `
        <button class="button primary" type="button" data-prep="advance" ${problem || saving ? 'disabled' : ''}>${icon(current.icon)} ${saving ? 'Saving batch…' : current.label}</button>
        ${problem.startsWith('You need more') ? '<button class="button secondary" type="button" data-prep="market">Visit the market</button>' : ''}`}
    </div>`;
    if (focus) content.querySelector(focus)?.focus({ preventScroll: true });
  }

  content.addEventListener('click', async (event) => {
    const control = event.target.closest('[data-prep]');
    if (!control || control.disabled || saving) return;
    const { prep, value } = control.dataset;
    if (prep === 'recipe' || prep === 'size') {
      if (prep === 'recipe') recipe = value;
      else servings = Number(value);
      reset();
      render(`[data-prep="${prep}"][data-value="${value}"]`);
    } else if (prep === 'advance') {
      if (batchProblem(getState(), recipe, servings)) return render();
      if (step < steps.length - 1) {
        step += 1;
        render('[data-prep="advance"]');
        return;
      }
      saving = true;
      render();
      const result = await make({ type: 'prepare', recipe, servings });
      saving = false;
      if (result?.ok) step = steps.length;
      else message = 'The batch wasn’t saved. Check your ingredients and try again.';
      if (dialog.open) render(result?.ok ? '[data-prep="close"]' : '[data-prep="advance"]');
    } else if (prep === 'repeat') {
      reset();
      render('[data-prep="recipe"][aria-pressed="true"]');
    } else if (prep === 'close' || prep === 'market') {
      dialog.close();
      if (prep === 'market') goMarket();
    }
  });

  dialog.addEventListener('close', onClose);

  return {
    open() {
      if (saving || dialog.open || !getState()) return;
      reset();
      render();
      dialog.showModal();
    },
    get active() { return dialog.open || saving; },
  };
}
