<script lang="ts">
  import { onMount } from 'svelte';
  export let style = '';
  let icon = `/assets/${__mode__}.png`;

  onMount(() => {
    if (import.meta.env.DEV) {
      const file =`../assets/${__mode__}.png`;
      import(file).then((module) => {
        icon = module.default;
      });
    } else {
      icon = `/assets/${__mode__}.png`;
    }
  });
</script>

<img class="icon" src={icon} alt="" draggable="false" style={style}>