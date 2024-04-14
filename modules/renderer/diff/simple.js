function simpleDiff(n1, n2, container, patch) {
  let lastIndex = 0;
  for (let i = 0; i < n2.length; i++) {
    let find = false;
    for (let j = 0; j < n1.length; j++) {
      if (n1[j].key === n2[i].key) {
        find = true;
        patch(n1, n2, container);
        if (lastIndex > j) {
          const anchor = n2[i - 1] ? n2[i - 1].el.nextSibling() : null;
          container.insertBefore(n1.el, anchor, container);
        } else {
          lastIndex = j;
        }
      }
    }
    if (!find) {
      const prevNode = n2[i - 1];
      const anchor = prevNode ? prevNode.nextSibling : container.firstChild;
      patch(null, n2, container, anchor);
    }
  }

  for (let i = 0; i < n1.length; i++) {
    const isExist = n2.find((item) => item.key === n1[i].key);
    if (!isExist) {
      container.removeChild(n1[i]);
    }
  }
}
