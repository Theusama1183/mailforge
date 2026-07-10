const dynamic = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  const LazyComponent = (props: any) => null
  LazyComponent.displayName = "LazyComponent"
  return LazyComponent
}

export default dynamic
