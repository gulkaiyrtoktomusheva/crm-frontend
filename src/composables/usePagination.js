import { ref, computed } from 'vue'

export function usePagination(initialPage = 0, initialSize = 20) {
  const page = ref(initialPage)
  const size = ref(initialSize)
  const totalElements = ref(0)
  const totalPages = ref(0)

  const hasNext = computed(() => page.value < totalPages.value - 1)
  const hasPrev = computed(() => page.value > 0)

  function setPage(newPage) {
    page.value = newPage
  }

  function nextPage() {
    if (hasNext.value) {
      page.value++
    }
  }

  function prevPage() {
    if (hasPrev.value) {
      page.value--
    }
  }

  function setTotal(total, pages) {
    totalElements.value = total
    totalPages.value = pages
  }

  function reset() {
    page.value = initialPage
  }

  const params = computed(() => ({
    page: page.value,
    size: size.value
  }))

  return {
    page,
    size,
    totalElements,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    nextPage,
    prevPage,
    setTotal,
    reset,
    params
  }
}
