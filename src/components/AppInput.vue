<template>
  <div class="input-wrap">
    <span v-if="$slots.icon" class="input-icon">
      <slot name="icon" />
    </span>
    <input
      class="app-input"
      :class="{ 'app-input--with-icon': $slots.icon }"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-wrap {
  position: relative;
  width: 100%;
}
.input-icon {
  position: absolute;
  left: var(--input-padding-h);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: var(--color-gray-600);
}
.app-input {
  width: 100%;
  background-color: var(--color-gray-100);
  border: none;
  border-radius: var(--radius-medium);
  padding: var(--input-padding-v) var(--input-padding-h);
  font-size: var(--fs-body1);
  color: var(--color-gray-900);
  outline: none;
  font-family: inherit;
}
.app-input--with-icon {
  padding-left: calc(var(--input-padding-h) + 28px);
}
.app-input::placeholder {
  color: var(--color-gray-600);
}
.app-input:focus {
  box-shadow: 0 0 0 2px var(--color-blue-primary);
}
</style>
