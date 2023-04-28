/**
 * https://developer.mozilla.org/zh-CN/docs/Web/HTML
 * @param {HTMLElement} el
 */
function build_html(el) {
  const nodes = el.querySelectorAll('a');
  const res = [];
  nodes.forEach(node => {
    const href = node.getAttribute('href');
    if (href) {
      res.push([href, node.innerText]);
    }
  });
  console.log(res);
}