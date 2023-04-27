<script lang="ts">
  import Icon from './icon.svelte';
  import { name } from './constants';
</script>

<div class="main">
  <div class="title">
    <h3>{name}</h3>
    <Icon class="icon" className="icon" />
  </div>
  <div class="about">
    <div>Setting</div>
    <div>Question</div>
    <div>Github</div>
  </div>
</div>
