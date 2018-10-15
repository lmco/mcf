const a = {
  package: { uid: '1', parent: null },
  children: [
    {
      package: { uid: '2', parent: { uid: '1' } },
      children: [
        {
          package: { uid: '7', parent: { uid: '2' } }, children: []
        },
        {
          package: { uid: '8', parent: { uid: '2' } }, children: []
        },
        { package: { uid: '9', parent: { uid: '2' } }, children: [] }
      ]
    },
    {
      package: { uid: '3', parent: { uid: '1' } },
      children: []
    },
    {
      package: { uid: '4', parent: { uid: '1' } },
      children: []
    },
    {
      package: { uid: '5', parent: { uid: '1' } },
      children: [
        {
          package: { uid: '10', parent: { uid: '5' } },
          children: [
            {
              package: { uid: '12', parent: { uid: '10' } },
              children: []
            },
            {
              package: { uid: '12', parent: { uid: '10' } },
              children: []
            }
          ]
        }
      ]
    },
    {
      package: { uid: '6', parent: { uid: '1' } },
      children: [
        {
          package: { uid: '11', parent: { uid: '6' } },
          children: []
        }
      ]
    }
  ]
};
