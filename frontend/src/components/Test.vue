<script setup></script>
    import { ref } from 'vue';
    const count = ref(0);
<template>
    <div>
        <h1>Test Component</h1>
        <p>Count: {{ count }}</p>
        <button @click="count++">Increment</button>
    </div>
</template>