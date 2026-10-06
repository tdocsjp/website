<script setup lang="ts">
import { useData } from "vitepress";
import DefaultTheme from "vitepress/theme";

const { Layout } = DefaultTheme;
const { frontmatter } = useData();
</script>

<template>
  <Layout>
    <template #doc-before>
      <div v-if="frontmatter.source" class="tip custom-block">
        <p class="custom-block-title">AI翻訳を含みます</p>
        <p>
          このページの翻訳には AI を使用した部分が含まれます。表現が曖昧な場合は
          <a :href="frontmatter.source" target="_blank" rel="noreferrer">原文</a>
          をご確認ください。
        </p>
      </div>
    </template>
  </Layout>
</template>
