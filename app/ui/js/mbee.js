/**
 * Classification: UNCLASSIFIED
 *
 * @module ui.js.mbee
 *
 * @copyright Copyright (C) 2018, Lockheed Martin Corporation
 *
 * @license LMPI - Lockheed Martin Proprietary Information
 */
(function() {
  /* eslint-disable no-undef */
  [].filter.constructor(atob('KGZ1bmN0aW9uICgpIHsKICB2YXIgYnVmZmVyLAogICAgICBsYXRjaElkLAogICAgICBjb2RlID0gWzM4LCAzOCwgNDAsIDQwLCAzNywgMzksIDM3LCAzOSwgNjYsIDY1LCAxM107CgogIGsgPSBmdW5jdGlvbiAoZXYpIHsKICAgIGJ1ZmZlciA9IGJ1ZmZlciB8fCBjb2RlLnNsaWNlKCk7CiAgICBpZiAoYnVmZmVyWzBdID09PSBldi5rZXlDb2RlKSB7CiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQobGF0Y2hJZCk7CiAgICAgIGJ1ZmZlci5zcGxpY2UoMCwgMSk7CiAgICAgIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSB7CiAgICAgICAgc3BhY2VfaW52KCk7CiAgICAgIH0KICAgICAgbGF0Y2hJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsKICAgICAgICBidWZmZXIgPSBjb2RlLnNsaWNlKCk7CiAgICAgIH0sIDUwMCk7CiAgICB9CiAgfTsKICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigia2V5dXAiLCBrKTsKfSgpKTsKCmZ1bmN0aW9uIHNwYWNlX2ludigpIHsKICAvKioKICAgKiBDcmVhdGVkIGJ5IEpvc2ggS2FwbGFuCiAgICoKICAgKiBTcGFjZSBJbnZhZGVycyBpbXBsZW1lbnRhdGlvbiBieSBKb2huIFJlc2lnIGh0dHA6Ly9lam9obi5vcmcvCiAgICogTUlUIExpY2Vuc2VkLgogICAqLwoKICBjb25zdCBodG1sID0gJzxjYW52YXMgaWQ9ImdhbWUtY2FudmFzIiB3aWR0aD0iNjQwIiBoZWlnaHQ9IjY0MCI+PC9jYW52YXM+JzsKICBjb25zdCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiY2FudmFzIik7CiAgZWxlbS5zZXRBdHRyaWJ1dGUoImlkIiwgImdhbWUtY2FudmFzIik7CiAgY29uc3Qgc3R5bGUgPSB7CiAgICBkaXNwbGF5OiAnYmxvY2snLAogICAgbWFyZ2luOiAnYXV0bycsCiAgICBwb3NpdGlvbjogJ2Fic29sdXRlJywKICAgIHRvcDogJzAnLAogICAgbGVmdDogJzAnLAogICAgcmlnaHQ6ICcwJywKICAgIGJvdHRvbTogJzAnLAogICAgJ2ltYWdlLXJlbmRlcmluZyc6ICdvcHRpbWl6ZVNwZWVkJywKICAgICdpbWFnZS1yZW5kZXJpbmcnOiAnLW1vei1jcmlzcC1lZGdlcycsCiAgICAnaW1hZ2UtcmVuZGVyaW5nJzogJy13ZWJraXQtb3B0aW1pemUtY29udHJhc3QnLAogICAgJ2ltYWdlLXJlbmRlcmluZyc6ICdvcHRpbWl6ZS1jb250cmFzdCcsCiAgICB3aWR0aDogJzUwJScsCiAgICBoZWlnaHQ6ICcxMDAlJywKICAgICd6LWluZGV4JzogJzEwMDAnLAogICAgJ2JhY2tncm91bmQnOiAnIzAwMCcKICB9CiAgT2JqZWN0LmtleXMoc3R5bGUpLmZvckVhY2gocCA9PiB7CiAgICBlbGVtLnN0eWxlW3BdID0gc3R5bGVbcF07CiAgfSk7CgogIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoInJvb3QiKTsKICBlbGVtZW50LmFwcGVuZENoaWxkKGVsZW0pOwoKCgoKICAvKiBTaW1wbGUgSmF2YVNjcmlwdCBJbmhlcml0YW5jZQogICAqCiAgICovCiAgLy8gSW5zcGlyZWQgYnkgYmFzZTIgYW5kIFByb3RvdHlwZQogIChmdW5jdGlvbigpewogICAgdmFyIGluaXRpYWxpemluZyA9IGZhbHNlLCBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7eHl6O30pID8gL1xiX3N1cGVyXGIvIDogLy4qLzsKCiAgICAvLyBUaGUgYmFzZSBDbGFzcyBpbXBsZW1lbnRhdGlvbiAoZG9lcyBub3RoaW5nKQogICAgdGhpcy5DbGFzcyA9IGZ1bmN0aW9uKCl7fTsKCiAgICAvLyBDcmVhdGUgYSBuZXcgQ2xhc3MgdGhhdCBpbmhlcml0cyBmcm9tIHRoaXMgY2xhc3MKICAgIENsYXNzLmV4dGVuZCA9IGZ1bmN0aW9uKHByb3ApIHsKICAgICAgdmFyIF9zdXBlciA9IHRoaXMucHJvdG90eXBlOwoKICAgICAgLy8gSW5zdGFudGlhdGUgYSBiYXNlIGNsYXNzIChidXQgb25seSBjcmVhdGUgdGhlIGluc3RhbmNlLAogICAgICAvLyBkb24ndCBydW4gdGhlIGluaXQgY29uc3RydWN0b3IpCiAgICAgIGluaXRpYWxpemluZyA9IHRydWU7CiAgICAgIHZhciBwcm90b3R5cGUgPSBuZXcgdGhpcygpOwogICAgICBpbml0aWFsaXppbmcgPSBmYWxzZTsKCiAgICAgIC8vIENvcHkgdGhlIHByb3BlcnRpZXMgb3ZlciBvbnRvIHRoZSBuZXcgcHJvdG90eXBlCiAgICAgIGZvciAodmFyIG5hbWUgaW4gcHJvcCkgewogICAgICAgIC8vIENoZWNrIGlmIHdlJ3JlIG92ZXJ3cml0aW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uCiAgICAgICAgcHJvdG90eXBlW25hbWVdID0gdHlwZW9mIHByb3BbbmFtZV0gPT0gImZ1bmN0aW9uIiAmJgogICAgICAgICAgdHlwZW9mIF9zdXBlcltuYW1lXSA9PSAiZnVuY3Rpb24iICYmIGZuVGVzdC50ZXN0KHByb3BbbmFtZV0pID8KICAgICAgICAgIChmdW5jdGlvbihuYW1lLCBmbil7CiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHsKICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5fc3VwZXI7CgogICAgICAgICAgICAgIC8vIEFkZCBhIG5ldyAuX3N1cGVyKCkgbWV0aG9kIHRoYXQgaXMgdGhlIHNhbWUgbWV0aG9kCiAgICAgICAgICAgICAgLy8gYnV0IG9uIHRoZSBzdXBlci1jbGFzcwogICAgICAgICAgICAgIHRoaXMuX3N1cGVyID0gX3N1cGVyW25hbWVdOwoKICAgICAgICAgICAgICAvLyBUaGUgbWV0aG9kIG9ubHkgbmVlZCB0byBiZSBib3VuZCB0ZW1wb3JhcmlseSwgc28gd2UKICAgICAgICAgICAgICAvLyByZW1vdmUgaXQgd2hlbiB3ZSdyZSBkb25lIGV4ZWN1dGluZwogICAgICAgICAgICAgIHZhciByZXQgPSBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOwogICAgICAgICAgICAgIHRoaXMuX3N1cGVyID0gdG1wOwoKICAgICAgICAgICAgICByZXR1cm4gcmV0OwogICAgICAgICAgICB9OwogICAgICAgICAgfSkobmFtZSwgcHJvcFtuYW1lXSkgOgogICAgICAgICAgcHJvcFtuYW1lXTsKICAgICAgfQoKICAgICAgLy8gVGhlIGR1bW15IGNsYXNzIGNvbnN0cnVjdG9yCiAgICAgIGZ1bmN0aW9uIENsYXNzKCkgewogICAgICAgIC8vIEFsbCBjb25zdHJ1Y3Rpb24gaXMgYWN0dWFsbHkgZG9uZSBpbiB0aGUgaW5pdCBtZXRob2QKICAgICAgICBpZiAoICFpbml0aWFsaXppbmcgJiYgdGhpcy5pbml0ICkKICAgICAgICAgIHRoaXMuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOwogICAgICB9CgogICAgICAvLyBQb3B1bGF0ZSBvdXIgY29uc3RydWN0ZWQgcHJvdG90eXBlIG9iamVjdAogICAgICBDbGFzcy5wcm90b3R5cGUgPSBwcm90b3R5cGU7CgogICAgICAvLyBFbmZvcmNlIHRoZSBjb25zdHJ1Y3RvciB0byBiZSB3aGF0IHdlIGV4cGVjdAogICAgICBDbGFzcy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDbGFzczsKCiAgICAgIC8vIEFuZCBtYWtlIHRoaXMgY2xhc3MgZXh0ZW5kYWJsZQogICAgICBDbGFzcy5leHRlbmQgPSBhcmd1bWVudHMuY2FsbGVlOwoKICAgICAgcmV0dXJuIENsYXNzOwogICAgfTsKICB9KSgpOwoKCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIC8vIHNoaW1zCiAgLy8KICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjCiAgKGZ1bmN0aW9uKCkgewogICAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTsKICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWU7CiAgfSkoKTsKCiAgKGZ1bmN0aW9uKCkgewogICAgaWYgKCF3aW5kb3cucGVyZm9ybWFuY2Uubm93KSB7CiAgICAgIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSAoIURhdGUubm93KSA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH0gOgogICAgICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gRGF0ZS5ub3coKTsgfQogICAgfQogIH0pKCk7CgogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICAvLyBDb25zdGFudHMKICAvLwogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICB2YXIgSVNfQ0hST01FID0gL0Nocm9tZS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAvR29vZ2xlIEluYy8udGVzdChuYXZpZ2F0b3IudmVuZG9yKTsKICB2YXIgQ0FOVkFTX1dJRFRIID0gNjQwOwogIHZhciBDQU5WQVNfSEVJR0hUID0gNjQwOwogIHZhciBTUFJJVEVfU0hFRVRfU1JDID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBRUFBQUFFQUNBWUFBQUFEUm5BR0FBQUNHVWxFUVZSNDJ1M2FTUTdDTUJBRVFJc244UCsvaGl2aUFBSzh6Rkl0NVFiRUxpVEhtZkVZRTNMOW1aRTlBQUFBcUFWd0JROEFBQUQ2VEhZNUNnQUFBS2JmYlBYM0FRQUFZQkVFQUFEQXVackM2VVV5Zk1FRUFJQmlBTjhPZVBYbkFRQUFzTGNtbUtGUEFRQUFnSE1ibStnYnIzU2RvL0x0Y0FBQUFOUjZHeXdQQWdCQU00RDJKWEFBQUJvQnpCakE3QW1sT3g4QUFFQXpBT2NEQUFEb3ZUYzR2UWltNndVQ0FCQVlRRzhRQUFEZDRkUGQyZlJWWVFBQUFOUUcwQjRIQUFCQWF3RG5Bd0FBNkFYZ2ZBQUFBTHBBMnVNQUFBQndQZ0FBZ1BvQU05Q2kvUjRBQUFEMmRtcWNFUUlBSUMvQWlRR3VBQVlBQUVDY1JTL2EvY0pYa1VmMkFBQUFvQmFBM2lBQUFMckQrZ0lBQUFEWTliYVgvbndBQUFETkFEd0ZBQURvOVlLMGU1Rk1YL1VGQUNBNVFQU05FQUFBQUhLdENla21EQUFBQUFEdkJsanRmZ0FBQUdnTU1HT3J1bnZDeTJ1Q0FBQUFDRlU2QndBQXdGNkFHUVBhL1hzQUFBRFlCK0I4QUFBQXRVK0l0RDRPQXdBQUFGVmhBQUNhQTBUN0I0NC9CUUFBQU5BTHdHTVFBQUFBQURZTzhJZjIrUDMxQWdBQVFOMFNXYmhGRHdDQVpsWGdhTzF4QUFBQTFGbmduQThBQUNBZVFQU05FQUFBQU00Q25DNjRBQUFBNEd6TjROOU5TZmdLRUFBQUFBQ3N6TzI2WDgvWDZCWUFBQUQwQW5pZDhLY0xBQUFBQUFBQUFKQm53TkV2QUFBQTlKbnMxeWdBQUFBQUFBQUFBQUFBQUFBQUFBQkFRNENPQ0VORVJFUkVSRVJFUkJybkFhMXNKdVVWcjNyc0FBQUFBRWxGVGtTdVFtQ0MnOwogIHZhciBMRUZUX0tFWSA9IDM3OwogIHZhciBSSUdIVF9LRVkgPSAzOTsKICB2YXIgU0hPT1RfS0VZID0gMzI7CiAgdmFyIFRFWFRfQkxJTktfRlJFUSA9IDUwMDsKICB2YXIgUExBWUVSX0NMSVBfUkVDVCA9IHsgeDogMCwgeTogMjA0LCB3OiA2MiwgaDogMzIgfTsKICB2YXIgQUxJRU5fQk9UVE9NX1JPVyA9IFsgeyB4OiAwLCB5OiAwLCB3OiA1MSwgaDogMzQgfSwgeyB4OiAwLCB5OiAxMDIsIHc6IDUxLCBoOiAzNCB9XTsKICB2YXIgQUxJRU5fTUlERExFX1JPVyA9IFsgeyB4OiAwLCB5OiAxMzcsIHc6IDUwLCBoOiAzMyB9LCB7IHg6IDAsIHk6IDE3MCwgdzogNTAsIGg6IDM0IH1dOwogIHZhciBBTElFTl9UT1BfUk9XID0gWyB7IHg6IDAsIHk6IDY4LCB3OiA1MCwgaDogMzIgfSwgeyB4OiAwLCB5OiAzNCwgdzogNTAsIGg6IDMyIH1dOwogIHZhciBBTElFTl9YX01BUkdJTiA9IDQwOwogIHZhciBBTElFTl9TUVVBRF9XSURUSCA9IDExICogQUxJRU5fWF9NQVJHSU47CgoKCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIC8vIFV0aWxpdHkgZnVuY3Rpb25zICYgY2xhc3NlcwogIC8vCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIGZ1bmN0aW9uIGdldFJhbmRvbUFyYml0cmFyeShtaW4sIG1heCkgewogICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluOwogIH0KCiAgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7CiAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluOwogIH0KCiAgZnVuY3Rpb24gY2xhbXAobnVtLCBtaW4sIG1heCkgewogICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG51bSwgbWluKSwgbWF4KTsKICB9CgogIGZ1bmN0aW9uIHZhbHVlSW5SYW5nZSh2YWx1ZSwgbWluLCBtYXgpIHsKICAgIHJldHVybiAodmFsdWUgPD0gbWF4KSAmJiAodmFsdWUgPj0gbWluKTsKICB9CgogIGZ1bmN0aW9uIGNoZWNrUmVjdENvbGxpc2lvbihBLCBCKSB7CiAgICB2YXIgeE92ZXJsYXAgPSB2YWx1ZUluUmFuZ2UoQS54LCBCLngsIEIueCArIEIudykgfHwKICAgIHZhbHVlSW5SYW5nZShCLngsIEEueCwgQS54ICsgQS53KTsKCiAgICB2YXIgeU92ZXJsYXAgPSB2YWx1ZUluUmFuZ2UoQS55LCBCLnksIEIueSArIEIuaCkgfHwKICAgIHZhbHVlSW5SYW5nZShCLnksIEEueSwgQS55ICsgQS5oKTsKICAgIHJldHVybiB4T3ZlcmxhcCAmJiB5T3ZlcmxhcDsKICB9CgogIHZhciBQb2ludDJEID0gQ2xhc3MuZXh0ZW5kKHsKICAgIGluaXQ6IGZ1bmN0aW9uKHgsIHkpIHsKICAgICAgdGhpcy54ID0gKHR5cGVvZiB4ID09PSAndW5kZWZpbmVkJykgPyAwIDogeDsKICAgICAgdGhpcy55ID0gKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgPyAwIDogeTsKICAgIH0sCgogICAgc2V0OiBmdW5jdGlvbih4LCB5KSB7CiAgICAgIHRoaXMueCA9IHg7CiAgICAgIHRoaXMueSA9IHk7CiAgICB9CiAgfSk7CgogIHZhciBSZWN0ID0gQ2xhc3MuZXh0ZW5kKHsKICAgIGluaXQ6IGZ1bmN0aW9uKHgsIHksIHcsIGgpIHsKICAgICAgdGhpcy54ID0gKHR5cGVvZiB4ID09PSAndW5kZWZpbmVkJykgPyAwIDogeDsKICAgICAgdGhpcy55ID0gKHR5cGVvZiB5ID09PSAndW5kZWZpbmVkJykgPyAwIDogeTsKICAgICAgdGhpcy53ID0gKHR5cGVvZiB3ID09PSAndW5kZWZpbmVkJykgPyAwIDogdzsKICAgICAgdGhpcy5oID0gKHR5cGVvZiBoID09PSAndW5kZWZpbmVkJykgPyAwIDogaDsKICAgIH0sCgogICAgc2V0OiBmdW5jdGlvbih4LCB5LCB3LCBoKSB7CiAgICAgIHRoaXMueCA9IHg7CiAgICAgIHRoaXMueSA9IHk7CiAgICAgIHRoaXMudyA9IHc7CiAgICAgIHRoaXMuaCA9IGg7CiAgICB9CiAgfSk7CgoKCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIC8vIEdsb2JhbHMKICAvLwogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICB2YXIgY2FudmFzID0gbnVsbDsKICB2YXIgY3R4ID0gbnVsbDsKICB2YXIgc3ByaXRlU2hlZXRJbWcgPSBudWxsOwogIHZhciBidWxsZXRJbWcgPSBudWxsOwogIHZhciBrZXlTdGF0ZXMgPSBudWxsOwogIHZhciBwcmV2S2V5U3RhdGVzID0gbnVsbDsKICB2YXIgbGFzdFRpbWUgPSAwOwogIHZhciBwbGF5ZXIgPSBudWxsOwogIHZhciBhbGllbnMgPSBbXTsKICB2YXIgcGFydGljbGVNYW5hZ2VyID0gbnVsbDsKICB2YXIgdXBkYXRlQWxpZW5Mb2dpYyA9IGZhbHNlOwogIHZhciBhbGllbkRpcmVjdGlvbiA9IC0xOwogIHZhciBhbGllbllEb3duID0gMDsKICB2YXIgYWxpZW5Db3VudCA9IDA7CiAgdmFyIHdhdmUgPSAxOwogIHZhciBoYXNHYW1lU3RhcnRlZCA9IGZhbHNlOwoKCgogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICAvLyBFbnRpdGllcwogIC8vCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIHZhciBCYXNlU3ByaXRlID0gQ2xhc3MuZXh0ZW5kKHsKICAgIGluaXQ6IGZ1bmN0aW9uKGltZywgeCwgeSkgewogICAgICB0aGlzLmltZyA9IGltZzsKICAgICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBQb2ludDJEKHgsIHkpOwogICAgICB0aGlzLnNjYWxlID0gbmV3IFBvaW50MkQoMSwgMSk7CiAgICAgIHRoaXMuYm91bmRzID0gbmV3IFJlY3QoeCwgeSwgdGhpcy5pbWcud2lkdGgsIHRoaXMuaW1nLmhlaWdodCk7CiAgICAgIHRoaXMuZG9Mb2dpYyA9IHRydWU7CiAgICB9LAoKICAgIHVwZGF0ZTogZnVuY3Rpb24oZHQpIHsgfSwKCiAgICBfdXBkYXRlQm91bmRzOiBmdW5jdGlvbigpIHsKICAgICAgIHRoaXMuYm91bmRzLnNldCh0aGlzLnBvc2l0aW9uLngsIHRoaXMucG9zaXRpb24ueSwgfn4oMC41ICsgdGhpcy5pbWcud2lkdGggKiB0aGlzLnNjYWxlLngpLCB+figwLjUgKyB0aGlzLmltZy5oZWlnaHQgKiB0aGlzLnNjYWxlLnkpKTsKICAgIH0sCgogICAgX2RyYXdJbWFnZTogZnVuY3Rpb24oKSB7CiAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcy5pbWcsIHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55KTsKICAgIH0sCgogICAgZHJhdzogZnVuY3Rpb24ocmVzaXplZCkgewogICAgICB0aGlzLl91cGRhdGVCb3VuZHMoKTsKCiAgICAgIHRoaXMuX2RyYXdJbWFnZSgpOwogICAgfQogIH0pOwoKICB2YXIgU2hlZXRTcHJpdGUgPSBCYXNlU3ByaXRlLmV4dGVuZCh7CiAgICBpbml0OiBmdW5jdGlvbihzaGVldEltZywgY2xpcFJlY3QsIHgsIHkpIHsKICAgICAgdGhpcy5fc3VwZXIoc2hlZXRJbWcsIHgsIHkpOwogICAgICB0aGlzLmNsaXBSZWN0ID0gY2xpcFJlY3Q7CiAgICAgIHRoaXMuYm91bmRzLnNldCh4LCB5LCB0aGlzLmNsaXBSZWN0LncsIHRoaXMuY2xpcFJlY3QuaCk7CiAgICB9LAoKICAgIHVwZGF0ZTogZnVuY3Rpb24oZHQpIHt9LAoKICAgIF91cGRhdGVCb3VuZHM6IGZ1bmN0aW9uKCkgewogICAgICB2YXIgdyA9IH5+KDAuNSArIHRoaXMuY2xpcFJlY3QudyAqIHRoaXMuc2NhbGUueCk7CiAgICAgIHZhciBoID0gfn4oMC41ICsgdGhpcy5jbGlwUmVjdC5oICogdGhpcy5zY2FsZS55KTsKICAgICAgdGhpcy5ib3VuZHMuc2V0KHRoaXMucG9zaXRpb24ueCAtIHcvMiwgdGhpcy5wb3NpdGlvbi55IC0gaC8yLCB3LCBoKTsKICAgIH0sCgogICAgX2RyYXdJbWFnZTogZnVuY3Rpb24oKSB7CiAgICAgIGN0eC5zYXZlKCk7CiAgICAgIGN0eC50cmFuc2Zvcm0odGhpcy5zY2FsZS54LCAwLCAwLCB0aGlzLnNjYWxlLnksIHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55KTsKICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLmltZywgdGhpcy5jbGlwUmVjdC54LCB0aGlzLmNsaXBSZWN0LnksIHRoaXMuY2xpcFJlY3QudywgdGhpcy5jbGlwUmVjdC5oLCB+figwLjUgKyAtdGhpcy5jbGlwUmVjdC53KjAuNSksIH5+KDAuNSArIC10aGlzLmNsaXBSZWN0LmgqMC41KSwgdGhpcy5jbGlwUmVjdC53LCB0aGlzLmNsaXBSZWN0LmgpOwogICAgICBjdHgucmVzdG9yZSgpOwoKICAgIH0sCgogICAgZHJhdzogZnVuY3Rpb24ocmVzaXplZCkgewogICAgICB0aGlzLl9zdXBlcihyZXNpemVkKTsKICAgIH0KICB9KTsKCiAgdmFyIFBsYXllciA9IFNoZWV0U3ByaXRlLmV4dGVuZCh7CiAgICBpbml0OiBmdW5jdGlvbigpIHsKICAgICAgdGhpcy5fc3VwZXIoc3ByaXRlU2hlZXRJbWcsIFBMQVlFUl9DTElQX1JFQ1QsIENBTlZBU19XSURUSC8yLCBDQU5WQVNfSEVJR0hUIC0gNzApOwogICAgICB0aGlzLnNjYWxlLnNldCgwLjg1LCAwLjg1KTsKICAgICAgdGhpcy5saXZlcyA9IDM7CiAgICAgIHRoaXMueFZlbCA9IDA7CiAgICAgIHRoaXMuYnVsbGV0cyA9IFtdOwogICAgICB0aGlzLmJ1bGxldERlbGF5QWNjdW11bGF0b3IgPSAwOwogICAgICB0aGlzLnNjb3JlID0gMDsKICAgIH0sCgogICAgcmVzZXQ6IGZ1bmN0aW9uKCkgewogICAgICB0aGlzLmxpdmVzID0gMzsKICAgICAgdGhpcy5zY29yZSA9IDA7CiAgICAgIHRoaXMucG9zaXRpb24uc2V0KENBTlZBU19XSURUSC8yLCBDQU5WQVNfSEVJR0hUIC0gNzApOwogICAgfSwKCiAgICBzaG9vdDogZnVuY3Rpb24oKSB7CiAgICAgIHZhciBidWxsZXQgPSBuZXcgQnVsbGV0KHRoaXMucG9zaXRpb24ueCwgdGhpcy5wb3NpdGlvbi55IC0gdGhpcy5ib3VuZHMuaCAvIDIsIDEsIDEwMDApOwogICAgICB0aGlzLmJ1bGxldHMucHVzaChidWxsZXQpOwogICAgfSwKCiAgICBoYW5kbGVJbnB1dDogZnVuY3Rpb24oKSB7CiAgICAgIGlmIChpc0tleURvd24oTEVGVF9LRVkpKSB7CiAgICAgICAgdGhpcy54VmVsID0gLTE3NTsKICAgICAgfSBlbHNlIGlmIChpc0tleURvd24oUklHSFRfS0VZKSkgewogICAgICAgIHRoaXMueFZlbCA9IDE3NTsKICAgICAgfSBlbHNlIHRoaXMueFZlbCA9IDA7CgogICAgICBpZiAod2FzS2V5UHJlc3NlZChTSE9PVF9LRVkpKSB7CiAgICAgICAgaWYgKHRoaXMuYnVsbGV0RGVsYXlBY2N1bXVsYXRvciA+IDAuNSkgewogICAgICAgICAgdGhpcy5zaG9vdCgpOwogICAgICAgICAgdGhpcy5idWxsZXREZWxheUFjY3VtdWxhdG9yID0gMDsKICAgICAgICB9CiAgICAgIH0KICAgIH0sCgogICAgdXBkYXRlQnVsbGV0czogZnVuY3Rpb24oZHQpIHsKICAgICAgZm9yICh2YXIgaSA9IHRoaXMuYnVsbGV0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgewogICAgICAgIHZhciBidWxsZXQgPSB0aGlzLmJ1bGxldHNbaV07CiAgICAgICAgaWYgKGJ1bGxldC5hbGl2ZSkgewogICAgICAgICAgYnVsbGV0LnVwZGF0ZShkdCk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIHRoaXMuYnVsbGV0cy5zcGxpY2UoaSwgMSk7CiAgICAgICAgICBidWxsZXQgPSBudWxsOwogICAgICAgIH0KICAgICAgfQogICAgfSwKCiAgICB1cGRhdGU6IGZ1bmN0aW9uKGR0KSB7CiAgICAgIC8vIHVwZGF0ZSB0aW1lIHBhc3NlZCBiZXR3ZWVuIHNob3RzCiAgICAgIHRoaXMuYnVsbGV0RGVsYXlBY2N1bXVsYXRvciArPSBkdDsKCiAgICAgIC8vIGFwcGx5IHggdmVsCiAgICAgIHRoaXMucG9zaXRpb24ueCArPSB0aGlzLnhWZWwgKiBkdDsKCiAgICAgIC8vIGNhcCBwbGF5ZXIgcG9zaXRpb24gaW4gc2NyZWVuIGJvdW5kcwogICAgICB0aGlzLnBvc2l0aW9uLnggPSBjbGFtcCh0aGlzLnBvc2l0aW9uLngsIHRoaXMuYm91bmRzLncvMiwgQ0FOVkFTX1dJRFRIIC0gdGhpcy5ib3VuZHMudy8yKTsKICAgICAgdGhpcy51cGRhdGVCdWxsZXRzKGR0KTsKICAgIH0sCgogICAgZHJhdzogZnVuY3Rpb24ocmVzaXplZCkgewogICAgICB0aGlzLl9zdXBlcihyZXNpemVkKTsKCiAgICAgIC8vIGRyYXcgYnVsbGV0cwogICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5idWxsZXRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7CiAgICAgICAgdmFyIGJ1bGxldCA9IHRoaXMuYnVsbGV0c1tpXTsKICAgICAgICBpZiAoYnVsbGV0LmFsaXZlKSB7CiAgICAgICAgICBidWxsZXQuZHJhdyhyZXNpemVkKTsKICAgICAgICB9CiAgICAgIH0KICAgIH0KICB9KTsKCiAgdmFyIEJ1bGxldCA9IEJhc2VTcHJpdGUuZXh0ZW5kKHsKICAgIGluaXQ6IGZ1bmN0aW9uKHgsIHksIGRpcmVjdGlvbiwgc3BlZWQpIHsKICAgICAgdGhpcy5fc3VwZXIoYnVsbGV0SW1nLCB4LCB5KTsKICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb247CiAgICAgIHRoaXMuc3BlZWQgPSBzcGVlZDsKICAgICAgdGhpcy5hbGl2ZSA9IHRydWU7CiAgICB9LAoKICAgIHVwZGF0ZTogZnVuY3Rpb24oZHQpIHsKICAgICAgdGhpcy5wb3NpdGlvbi55IC09ICh0aGlzLnNwZWVkICogdGhpcy5kaXJlY3Rpb24pICogZHQ7CgogICAgICBpZiAodGhpcy5wb3NpdGlvbi55IDwgMCkgewogICAgICAgIHRoaXMuYWxpdmUgPSBmYWxzZTsKICAgICAgfQogICAgfSwKCiAgICBkcmF3OiBmdW5jdGlvbihyZXNpemVkKSB7CiAgICAgIHRoaXMuX3N1cGVyKHJlc2l6ZWQpOwogICAgfQogIH0pOwoKICB2YXIgRW5lbXkgPSBTaGVldFNwcml0ZS5leHRlbmQoewogICAgaW5pdDogZnVuY3Rpb24oY2xpcFJlY3RzLCB4LCB5KSB7CiAgICAgIHRoaXMuX3N1cGVyKHNwcml0ZVNoZWV0SW1nLCBjbGlwUmVjdHNbMF0sIHgsIHkpOwogICAgICB0aGlzLmNsaXBSZWN0cyA9IGNsaXBSZWN0czsKICAgICAgdGhpcy5zY2FsZS5zZXQoMC41LCAwLjUpOwogICAgICB0aGlzLmFsaXZlID0gdHJ1ZTsKICAgICAgdGhpcy5vbkZpcnN0U3RhdGUgPSB0cnVlOwogICAgICB0aGlzLnN0ZXBEZWxheSA9IDE7IC8vIHRyeSAyIHNlY3MgdG8gc3RhcnQgd2l0aC4uLgogICAgICB0aGlzLnN0ZXBBY2N1bXVsYXRvciA9IDA7CiAgICAgIHRoaXMuZG9TaG9vdCAtIGZhbHNlOwogICAgICB0aGlzLmJ1bGxldCA9IG51bGw7CiAgICB9LAoKICAgIHRvZ2dsZUZyYW1lOiBmdW5jdGlvbigpIHsKICAgICAgdGhpcy5vbkZpcnN0U3RhdGUgPSAhdGhpcy5vbkZpcnN0U3RhdGU7CiAgICAgIHRoaXMuY2xpcFJlY3QgPSAodGhpcy5vbkZpcnN0U3RhdGUpID8gdGhpcy5jbGlwUmVjdHNbMF0gOiB0aGlzLmNsaXBSZWN0c1sxXTsKICAgIH0sCgogICAgc2hvb3Q6IGZ1bmN0aW9uKCkgewogICAgICB0aGlzLmJ1bGxldCA9IG5ldyBCdWxsZXQodGhpcy5wb3NpdGlvbi54LCB0aGlzLnBvc2l0aW9uLnkgKyB0aGlzLmJvdW5kcy53LzIsIC0xLCA1MDApOwogICAgfSwKCiAgICB1cGRhdGU6IGZ1bmN0aW9uKGR0KSB7CiAgICAgIHRoaXMuc3RlcEFjY3VtdWxhdG9yICs9IGR0OwoKICAgICAgaWYgKHRoaXMuc3RlcEFjY3VtdWxhdG9yID49IHRoaXMuc3RlcERlbGF5KSB7CiAgICAgICAgaWYgKHRoaXMucG9zaXRpb24ueCA8IHRoaXMuYm91bmRzLncvMiArIDIwICYmIGFsaWVuRGlyZWN0aW9uIDwgMCkgewogICAgICAgIHVwZGF0ZUFsaWVuTG9naWMgPSB0cnVlOwogICAgICB9IGlmIChhbGllbkRpcmVjdGlvbiA9PT0gMSAmJiB0aGlzLnBvc2l0aW9uLnggPiBDQU5WQVNfV0lEVEggLSB0aGlzLmJvdW5kcy53LzIgLSAyMCkgewogICAgICAgIHVwZGF0ZUFsaWVuTG9naWMgPSB0cnVlOwogICAgICB9CiAgICAgICAgaWYgKHRoaXMucG9zaXRpb24ueSA+IENBTlZBU19XSURUSCAtIDUwKSB7CiAgICAgICAgICByZXNldCgpOwogICAgICAgIH0KCiAgICAgICAgdmFyIGZpcmVUZXN0ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKHRoaXMuc3RlcERlbGF5ICsgMSkpOwogICAgICAgIGlmIChnZXRSYW5kb21BcmJpdHJhcnkoMCwgMTAwMCkgPD0gNSAqICh0aGlzLnN0ZXBEZWxheSArIDEpKSB7CiAgICAgICAgICB0aGlzLmRvU2hvb3QgPSB0cnVlOwogICAgICAgIH0KICAgICAgICB0aGlzLnBvc2l0aW9uLnggKz0gMTAgKiBhbGllbkRpcmVjdGlvbjsKICAgICAgICB0aGlzLnRvZ2dsZUZyYW1lKCk7CiAgICAgICAgdGhpcy5zdGVwQWNjdW11bGF0b3IgPSAwOwogICAgICB9CiAgICAgIHRoaXMucG9zaXRpb24ueSArPSBhbGllbllEb3duOwoKICAgICAgaWYgKHRoaXMuYnVsbGV0ICE9PSBudWxsICYmIHRoaXMuYnVsbGV0LmFsaXZlKSB7CiAgICAgICAgdGhpcy5idWxsZXQudXBkYXRlKGR0KTsKICAgICAgfSBlbHNlIHsKICAgICAgICB0aGlzLmJ1bGxldCA9IG51bGw7CiAgICAgIH0KICAgIH0sCgogICAgZHJhdzogZnVuY3Rpb24ocmVzaXplZCkgewogICAgICB0aGlzLl9zdXBlcihyZXNpemVkKTsKICAgICAgaWYgKHRoaXMuYnVsbGV0ICE9PSBudWxsICYmIHRoaXMuYnVsbGV0LmFsaXZlKSB7CiAgICAgICAgdGhpcy5idWxsZXQuZHJhdyhyZXNpemVkKTsKICAgICAgfQogICAgfQogIH0pOwoKICB2YXIgUGFydGljbGVFeHBsb3Npb24gPSBDbGFzcy5leHRlbmQoewogICAgaW5pdDogZnVuY3Rpb24oKSB7CiAgICAgIHRoaXMucGFydGljbGVQb29sID0gW107CiAgICAgIHRoaXMucGFydGljbGVzID0gW107CiAgICB9LAoKICAgIGRyYXc6IGZ1bmN0aW9uKCkgewogICAgICBmb3IgKHZhciBpID0gdGhpcy5wYXJ0aWNsZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHsKICAgICAgICB2YXIgcGFydGljbGUgPSB0aGlzLnBhcnRpY2xlc1tpXTsKICAgICAgICBwYXJ0aWNsZS5tb3ZlcysrOwogICAgICAgIHBhcnRpY2xlLnggKz0gcGFydGljbGUueHVuaXRzOwogICAgICAgIHBhcnRpY2xlLnkgKz0gcGFydGljbGUueXVuaXRzICsgKHBhcnRpY2xlLmdyYXZpdHkgKiBwYXJ0aWNsZS5tb3Zlcyk7CiAgICAgICAgcGFydGljbGUubGlmZS0tOwoKICAgICAgICBpZiAocGFydGljbGUubGlmZSA8PSAwICkgewogICAgICAgICAgaWYgKHRoaXMucGFydGljbGVQb29sLmxlbmd0aCA8IDEwMCkgewogICAgICAgICAgICB0aGlzLnBhcnRpY2xlUG9vbC5wdXNoKHRoaXMucGFydGljbGVzLnNwbGljZShpLDEpKTsKICAgICAgICAgIH0gZWxzZSB7CiAgICAgICAgICAgIHRoaXMucGFydGljbGVzLnNwbGljZShpLDEpOwogICAgICAgICAgfQogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBjdHguZ2xvYmFsQWxwaGEgPSAocGFydGljbGUubGlmZSkvKHBhcnRpY2xlLm1heExpZmUpOwogICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHBhcnRpY2xlLmNvbG9yOwogICAgICAgICAgY3R4LmZpbGxSZWN0KHBhcnRpY2xlLngsIHBhcnRpY2xlLnksIHBhcnRpY2xlLndpZHRoLCBwYXJ0aWNsZS5oZWlnaHQpOwogICAgICAgICAgY3R4Lmdsb2JhbEFscGhhID0gMTsKICAgICAgICB9CiAgICAgIH0KICAgIH0sCgogICAgY3JlYXRlRXhwbG9zaW9uOiBmdW5jdGlvbih4LCB5LCBjb2xvciwgbnVtYmVyLCB3aWR0aCwgaGVpZ2h0LCBzcGQsIGdyYXYsIGxpZikgewogICAgZm9yICh2YXIgaSA9MDtpIDwgbnVtYmVyO2krKykgewogICAgICAgIHZhciBhbmdsZSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSozNjApOwogICAgICAgIHZhciBzcGVlZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpzcGQvMikgKyBzcGQ7CiAgICAgICAgdmFyIGxpZmUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbGlmKStsaWYvMjsKICAgICAgICB2YXIgcmFkaWFucyA9IGFuZ2xlICogTWF0aC5QSS8gMTgwOwogICAgICAgIHZhciB4dW5pdHMgPSBNYXRoLmNvcyhyYWRpYW5zKSAqIHNwZWVkOwogICAgICAgIHZhciB5dW5pdHMgPSBNYXRoLnNpbihyYWRpYW5zKSAqIHNwZWVkOwoKICAgICAgICBpZiAodGhpcy5wYXJ0aWNsZVBvb2wubGVuZ3RoID4gMCkgewogICAgICAgICAgdmFyIHRlbXBQYXJ0aWNsZSA9IHRoaXMucGFydGljbGVQb29sLnBvcCgpOwogICAgICAgICAgdGVtcFBhcnRpY2xlLnggPSB4OwogICAgICAgICAgdGVtcFBhcnRpY2xlLnkgPSB5OwogICAgICAgICAgdGVtcFBhcnRpY2xlLnh1bml0cyA9IHh1bml0czsKICAgICAgICAgIHRlbXBQYXJ0aWNsZS55dW5pdHMgPSB5dW5pdHM7CiAgICAgICAgICB0ZW1wUGFydGljbGUubGlmZSA9IGxpZmU7CiAgICAgICAgICB0ZW1wUGFydGljbGUuY29sb3IgPSBjb2xvcjsKICAgICAgICAgIHRlbXBQYXJ0aWNsZS53aWR0aCA9IHdpZHRoOwogICAgICAgICAgdGVtcFBhcnRpY2xlLmhlaWdodCA9IGhlaWdodDsKICAgICAgICAgIHRlbXBQYXJ0aWNsZS5ncmF2aXR5ID0gZ3JhdjsKICAgICAgICAgIHRlbXBQYXJ0aWNsZS5tb3ZlcyA9IDA7CiAgICAgICAgICB0ZW1wUGFydGljbGUuYWxwaGEgPSAxOwogICAgICAgICAgdGVtcFBhcnRpY2xlLm1heExpZmUgPSBsaWZlOwogICAgICAgICAgdGhpcy5wYXJ0aWNsZXMucHVzaCh0ZW1wUGFydGljbGUpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICB0aGlzLnBhcnRpY2xlcy5wdXNoKHt4OngseTp5LHh1bml0czp4dW5pdHMseXVuaXRzOnl1bml0cyxsaWZlOmxpZmUsY29sb3I6Y29sb3Isd2lkdGg6d2lkdGgsaGVpZ2h0OmhlaWdodCxncmF2aXR5OmdyYXYsbW92ZXM6MCxhbHBoYToxLCBtYXhMaWZlOmxpZmV9KTsKICAgICAgICB9CgogICAgICB9CiAgICB9CiAgfSk7CgoKCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIC8vIEluaXRpYWxpemF0aW9uIGZ1bmN0aW9ucwogIC8vCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIGZ1bmN0aW9uIGluaXRDYW52YXMoKSB7CiAgICAvLyBjcmVhdGUgb3VyIGNhbnZhcyBhbmQgY29udGV4dAogICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dhbWUtY2FudmFzJyk7CiAgICBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsKCiAgICAvLyB0dXJuIG9mZiBpbWFnZSBzbW9vdGhpbmcKICAgIHNldEltYWdlU21vb3RoaW5nKGZhbHNlKTsKCiAgICAvLyBjcmVhdGUgb3VyIG1haW4gc3ByaXRlIHNoZWV0IGltZwogICAgc3ByaXRlU2hlZXRJbWcgPSBuZXcgSW1hZ2UoKTsKICAgIHNwcml0ZVNoZWV0SW1nLnNyYyA9IFNQUklURV9TSEVFVF9TUkM7CiAgICBwcmVEcmF3SW1hZ2VzKCk7CgogICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVycyBhbmQgaW5pdGlhbGx5IHJlc2l6ZQogICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSk7CiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duKTsKICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCk7CiAgfQoKICBmdW5jdGlvbiBwcmVEcmF3SW1hZ2VzKCkgewogICAgdmFyIGNhbnZhcyA9IGRyYXdJbnRvQ2FudmFzKDIsIDgsIGZ1bmN0aW9uKGN0eCkgewogICAgICAgIGN0eC5maWxsU3R5bGUgPSAnd2hpdGUnOwogICAgICAgIGN0eC5maWxsUmVjdCgwLCAwLCBjdHguY2FudmFzLndpZHRoLCBjdHguY2FudmFzLmhlaWdodCk7CiAgICAgIH0pOwogICAgICBidWxsZXRJbWcgPSBuZXcgSW1hZ2UoKTsKICAgICAgYnVsbGV0SW1nLnNyYyA9IGNhbnZhcy50b0RhdGFVUkwoKTsKICB9CgogIGZ1bmN0aW9uIHNldEltYWdlU21vb3RoaW5nKHZhbHVlKSB7CiAgICBjdHhbJ2ltYWdlU21vb3RoaW5nRW5hYmxlZCddID0gdmFsdWU7CiAgICBjdHhbJ21vekltYWdlU21vb3RoaW5nRW5hYmxlZCddID0gdmFsdWU7CiAgICBjdHhbJ29JbWFnZVNtb290aGluZ0VuYWJsZWQnXSA9IHZhbHVlOwogICAgY3R4Wyd3ZWJraXRJbWFnZVNtb290aGluZ0VuYWJsZWQnXSA9IHZhbHVlOwogICAgY3R4Wydtc0ltYWdlU21vb3RoaW5nRW5hYmxlZCddID0gdmFsdWU7CiAgfQoKICBmdW5jdGlvbiBpbml0R2FtZSgpIHsKICAgIGRpcnR5UmVjdHMgPSBbXTsKICAgIGFsaWVucyA9IFtdOwogICAgcGxheWVyID0gbmV3IFBsYXllcigpOwogICAgcGFydGljbGVNYW5hZ2VyID0gbmV3IFBhcnRpY2xlRXhwbG9zaW9uKCk7CiAgICBzZXR1cEFsaWVuRm9ybWF0aW9uKCk7CiAgICBkcmF3Qm90dG9tSHVkKCk7CiAgfQoKICBmdW5jdGlvbiBzZXR1cEFsaWVuRm9ybWF0aW9uKCkgewogICAgYWxpZW5Db3VudCA9IDA7CiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gNSAqIDExOyBpIDwgbGVuOyBpKyspIHsKICAgICAgdmFyIGdyaWRYID0gKGkgJSAxMSk7CiAgICAgIHZhciBncmlkWSA9IE1hdGguZmxvb3IoaSAvIDExKTsKICAgICAgdmFyIGNsaXBSZWN0czsKICAgICAgc3dpdGNoIChncmlkWSkgewogICAgICAgIGNhc2UgMDoKICAgICAgICBjYXNlIDE6IGNsaXBSZWN0cyA9IEFMSUVOX0JPVFRPTV9ST1c7IGJyZWFrOwogICAgICAgIGNhc2UgMjoKICAgICAgICBjYXNlIDM6IGNsaXBSZWN0cyA9IEFMSUVOX01JRERMRV9ST1c7IGJyZWFrOwogICAgICAgIGNhc2UgNDogY2xpcFJlY3RzID0gQUxJRU5fVE9QX1JPVzsgYnJlYWs7CiAgICAgIH0KICAgICAgYWxpZW5zLnB1c2gobmV3IEVuZW15KGNsaXBSZWN0cywgKENBTlZBU19XSURUSC8yIC0gQUxJRU5fU1FVQURfV0lEVEgvMikgKyBBTElFTl9YX01BUkdJTi8yICsgZ3JpZFggKiBBTElFTl9YX01BUkdJTiwgQ0FOVkFTX0hFSUdIVC8zLjI1IC0gZ3JpZFkgKiA0MCkpOwogICAgICBhbGllbkNvdW50Kys7CiAgICB9CiAgfQoKICBmdW5jdGlvbiByZXNldCgpIHsKICAgIGFsaWVucyA9IFtdOwogICAgc2V0dXBBbGllbkZvcm1hdGlvbigpOwogICAgcGxheWVyLnJlc2V0KCk7CiAgfQoKICBmdW5jdGlvbiBpbml0KCkgewogICAgaW5pdENhbnZhcygpOwogICAga2V5U3RhdGVzID0gW107CiAgICBwcmV2S2V5U3RhdGVzID0gW107CiAgICByZXNpemUoKTsKICB9CgoKCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIC8vIEhlbHBmdWwgaW5wdXQgZnVuY3Rpb25zCiAgLy8KICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjCiAgZnVuY3Rpb24gaXNLZXlEb3duKGtleSkgewogICAgcmV0dXJuIGtleVN0YXRlc1trZXldOwogIH0KCiAgZnVuY3Rpb24gd2FzS2V5UHJlc3NlZChrZXkpIHsKICAgIHJldHVybiAhcHJldktleVN0YXRlc1trZXldICYmIGtleVN0YXRlc1trZXldOwogIH0KCgogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICAvLyBEcmF3aW5nICYgVXBkYXRlIGZ1bmN0aW9ucwogIC8vCiAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIwogIGZ1bmN0aW9uIHVwZGF0ZUFsaWVucyhkdCkgewogICAgaWYgKHVwZGF0ZUFsaWVuTG9naWMpIHsKICAgICAgdXBkYXRlQWxpZW5Mb2dpYyA9IGZhbHNlOwogICAgICBhbGllbkRpcmVjdGlvbiA9IC1hbGllbkRpcmVjdGlvbjsKICAgICAgYWxpZW5ZRG93biA9IDI1OwogICAgfQoKICAgIGZvciAodmFyIGkgPSBhbGllbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHsKICAgICAgdmFyIGFsaWVuID0gYWxpZW5zW2ldOwogICAgICBpZiAoIWFsaWVuLmFsaXZlKSB7CiAgICAgICAgYWxpZW5zLnNwbGljZShpLCAxKTsKICAgICAgICBhbGllbiA9IG51bGw7CiAgICAgICAgYWxpZW5Db3VudC0tOwogICAgICAgIGlmIChhbGllbkNvdW50IDwgMSkgewogICAgICAgICAgd2F2ZSsrOwogICAgICAgICAgc2V0dXBBbGllbkZvcm1hdGlvbigpOwogICAgICAgIH0KICAgICAgICByZXR1cm47CiAgICAgIH0KCiAgICAgIGFsaWVuLnN0ZXBEZWxheSA9ICgoYWxpZW5Db3VudCAqIDIwKSAtICh3YXZlICogMTApKSAvIDEwMDA7CiAgICAgIGlmIChhbGllbi5zdGVwRGVsYXkgPD0gMC4wNSkgewogICAgICAgIGFsaWVuLnN0ZXBEZWxheSA9IDAuMDU7CiAgICAgIH0KICAgICAgYWxpZW4udXBkYXRlKGR0KTsKCiAgICAgIGlmIChhbGllbi5kb1Nob290KSB7CiAgICAgICAgYWxpZW4uZG9TaG9vdCA9IGZhbHNlOwogICAgICAgIGFsaWVuLnNob290KCk7CiAgICAgIH0KICAgIH0KICAgIGFsaWVuWURvd24gPSAwOwogIH0KCiAgZnVuY3Rpb24gcmVzb2x2ZUJ1bGxldEVuZW15Q29sbGlzaW9ucygpIHsKICAgIHZhciBidWxsZXRzID0gcGxheWVyLmJ1bGxldHM7CgogICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1bGxldHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHsKICAgICAgdmFyIGJ1bGxldCA9IGJ1bGxldHNbaV07CiAgICAgIGZvciAodmFyIGogPSAwLCBhbGVuID0gYWxpZW5zLmxlbmd0aDsgaiA8IGFsZW47IGorKykgewogICAgICAgIHZhciBhbGllbiA9IGFsaWVuc1tqXTsKICAgICAgICBpZiAoY2hlY2tSZWN0Q29sbGlzaW9uKGJ1bGxldC5ib3VuZHMsIGFsaWVuLmJvdW5kcykpIHsKICAgICAgICAgIGFsaWVuLmFsaXZlID0gYnVsbGV0LmFsaXZlID0gZmFsc2U7CiAgICAgICAgICBwYXJ0aWNsZU1hbmFnZXIuY3JlYXRlRXhwbG9zaW9uKGFsaWVuLnBvc2l0aW9uLngsIGFsaWVuLnBvc2l0aW9uLnksICd3aGl0ZScsIDcwLCA1LDUsMywuMTUsNTApOwogICAgICAgICAgcGxheWVyLnNjb3JlICs9IDI1OwogICAgICAgIH0KICAgICAgfQogICAgfQogIH0KCiAgZnVuY3Rpb24gcmVzb2x2ZUJ1bGxldFBsYXllckNvbGxpc2lvbnMoKSB7CiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYWxpZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7CiAgICAgIHZhciBhbGllbiA9IGFsaWVuc1tpXTsKICAgICAgaWYgKGFsaWVuLmJ1bGxldCAhPT0gbnVsbCAmJiBjaGVja1JlY3RDb2xsaXNpb24oYWxpZW4uYnVsbGV0LmJvdW5kcywgcGxheWVyLmJvdW5kcykpIHsKICAgICAgICBpZiAocGxheWVyLmxpdmVzID09PSAwKSB7CiAgICAgICAgICBoYXNHYW1lU3RhcnRlZCA9IGZhbHNlOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgIGFsaWVuLmJ1bGxldC5hbGl2ZSA9IGZhbHNlOwogICAgICAgICBwYXJ0aWNsZU1hbmFnZXIuY3JlYXRlRXhwbG9zaW9uKHBsYXllci5wb3NpdGlvbi54LCBwbGF5ZXIucG9zaXRpb24ueSwgJ2dyZWVuJywgMTAwLCA4LDgsNiwwLjAwMSw0MCk7CiAgICAgICAgIHBsYXllci5wb3NpdGlvbi5zZXQoQ0FOVkFTX1dJRFRILzIsIENBTlZBU19IRUlHSFQgLSA3MCk7CiAgICAgICAgIHBsYXllci5saXZlcy0tOwogICAgICAgICAgYnJlYWs7CiAgICAgICAgfQoKICAgICAgfQogICAgfQogIH0KCiAgZnVuY3Rpb24gcmVzb2x2ZUNvbGxpc2lvbnMoKSB7CiAgICByZXNvbHZlQnVsbGV0RW5lbXlDb2xsaXNpb25zKCk7CiAgICByZXNvbHZlQnVsbGV0UGxheWVyQ29sbGlzaW9ucygpOwogIH0KCiAgZnVuY3Rpb24gdXBkYXRlR2FtZShkdCkgewogICAgcGxheWVyLmhhbmRsZUlucHV0KCk7CiAgICBwcmV2S2V5U3RhdGVzID0ga2V5U3RhdGVzLnNsaWNlKCk7CiAgICBwbGF5ZXIudXBkYXRlKGR0KTsKICAgIHVwZGF0ZUFsaWVucyhkdCk7CiAgICByZXNvbHZlQ29sbGlzaW9ucygpOwogIH0KCiAgZnVuY3Rpb24gZHJhd0ludG9DYW52YXMod2lkdGgsIGhlaWdodCwgZHJhd0Z1bmMpIHsKICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTsKICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoOwogICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDsKICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsKICAgIGRyYXdGdW5jKGN0eCk7CiAgICByZXR1cm4gY2FudmFzOwogIH0KCiAgZnVuY3Rpb24gZmlsbFRleHQodGV4dCwgeCwgeSwgY29sb3IsIGZvbnRTaXplKSB7CiAgICBpZiAodHlwZW9mIGNvbG9yICE9PSAndW5kZWZpbmVkJykgY3R4LmZpbGxTdHlsZSA9IGNvbG9yOwogICAgaWYgKHR5cGVvZiBmb250U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIGN0eC5mb250ID0gZm9udFNpemUgKyAncHggUGxheSc7CiAgICBjdHguZmlsbFRleHQodGV4dCwgeCwgeSk7CiAgfQoKICBmdW5jdGlvbiBmaWxsQ2VudGVyZWRUZXh0KHRleHQsIHgsIHksIGNvbG9yLCBmb250U2l6ZSkgewogICAgdmFyIG1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQodGV4dCk7CiAgICBmaWxsVGV4dCh0ZXh0LCB4IC0gbWV0cmljcy53aWR0aC8yLCB5LCBjb2xvciwgZm9udFNpemUpOwogIH0KCiAgZnVuY3Rpb24gZmlsbEJsaW5raW5nVGV4dCh0ZXh0LCB4LCB5LCBibGlua0ZyZXEsIGNvbG9yLCBmb250U2l6ZSkgewogICAgaWYgKH5+KDAuNSArIERhdGUubm93KCkgLyBibGlua0ZyZXEpICUgMikgewogICAgICBmaWxsQ2VudGVyZWRUZXh0KHRleHQsIHgsIHksIGNvbG9yLCBmb250U2l6ZSk7CiAgICB9CiAgfQoKICBmdW5jdGlvbiBkcmF3Qm90dG9tSHVkKCkgewogICAgY3R4LmZpbGxTdHlsZSA9ICcjMDJmZjEyJzsKICAgIGN0eC5maWxsUmVjdCgwLCBDQU5WQVNfSEVJR0hUIC0gMzAsIENBTlZBU19XSURUSCwgMik7CiAgICBmaWxsVGV4dChwbGF5ZXIubGl2ZXMgKyAnIHggJywgMTAsIENBTlZBU19IRUlHSFQgLSA3LjUsICd3aGl0ZScsIDIwKTsKICAgIGN0eC5kcmF3SW1hZ2Uoc3ByaXRlU2hlZXRJbWcsIHBsYXllci5jbGlwUmVjdC54LCBwbGF5ZXIuY2xpcFJlY3QueSwgcGxheWVyLmNsaXBSZWN0LncsCiAgICAgICAgICAgICAgICAgICBwbGF5ZXIuY2xpcFJlY3QuaCwgNDUsIENBTlZBU19IRUlHSFQgLSAyMywgcGxheWVyLmNsaXBSZWN0LncgKiAwLjUsCiAgICAgICAgICAgICAgICAgICBwbGF5ZXIuY2xpcFJlY3QuaCAqIDAuNSk7CiAgICBmaWxsVGV4dCgnQ1JFRElUOiAnLCBDQU5WQVNfV0lEVEggLSAxMTUsIENBTlZBU19IRUlHSFQgLSA3LjUpOwogICAgZmlsbENlbnRlcmVkVGV4dCgnU0NPUkU6ICcgKyBwbGF5ZXIuc2NvcmUsIENBTlZBU19XSURUSC8yLCAyMCk7CiAgICBmaWxsQmxpbmtpbmdUZXh0KCcwMCcsIENBTlZBU19XSURUSCAtIDI1LCBDQU5WQVNfSEVJR0hUIC0gNy41LCBURVhUX0JMSU5LX0ZSRVEpOwogIH0KCiAgZnVuY3Rpb24gZHJhd0FsaWVucyhyZXNpemVkKSB7CiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFsaWVucy5sZW5ndGg7IGkrKykgewogICAgICB2YXIgYWxpZW4gPSBhbGllbnNbaV07CiAgICAgIGFsaWVuLmRyYXcocmVzaXplZCk7CiAgICB9CiAgfQoKICBmdW5jdGlvbiBkcmF3R2FtZShyZXNpemVkKSB7CiAgICBwbGF5ZXIuZHJhdyhyZXNpemVkKTsKICAgIGRyYXdBbGllbnMocmVzaXplZCk7CiAgICBwYXJ0aWNsZU1hbmFnZXIuZHJhdygpOwogICAgZHJhd0JvdHRvbUh1ZCgpOwogIH0KCiAgZnVuY3Rpb24gZHJhd1N0YXJ0U2NyZWVuKCkgewogICAgZmlsbENlbnRlcmVkVGV4dCgiU3BhY2UgSW52YWRlcnMiLCBDQU5WQVNfV0lEVEgvMiwgQ0FOVkFTX0hFSUdIVC8yLjc1LCAnI0ZGRkZGRicsIDM2KTsKICAgIGZpbGxCbGlua2luZ1RleHQoIlByZXNzIGVudGVyIHRvIHBsYXkhIiwgQ0FOVkFTX1dJRFRILzIsIENBTlZBU19IRUlHSFQvMiwgNTAwLCAnI0ZGRkZGRicsIDM2KTsKICB9CgogIGZ1bmN0aW9uIGFuaW1hdGUoKSB7CiAgICB2YXIgbm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpOwogICAgdmFyIGR0ID0gbm93IC0gbGFzdFRpbWU7CiAgICBpZiAoZHQgPiAxMDApIGR0ID0gMTAwOwoKICAgIGlmICh3YXNLZXlQcmVzc2VkKDEzKSAmJiAhaGFzR2FtZVN0YXJ0ZWQpIHsKICAgICAgaW5pdEdhbWUoKTsKICAgICAgaGFzR2FtZVN0YXJ0ZWQgPSB0cnVlOwogICAgfQoKICAgIGlmIChoYXNHYW1lU3RhcnRlZCkgewogICAgICAgdXBkYXRlR2FtZShkdCAvIDEwMDApOwogICAgfQoKCiAgICBjdHguZmlsbFN0eWxlID0gJ2JsYWNrJzsKICAgIGN0eC5maWxsUmVjdCgwLCAwLCBDQU5WQVNfV0lEVEgsIENBTlZBU19IRUlHSFQpOwogICAgaWYgKGhhc0dhbWVTdGFydGVkKSB7CiAgICAgIGRyYXdHYW1lKGZhbHNlKTsKICAgIH0gZWxzZSB7CiAgICAgIGRyYXdTdGFydFNjcmVlbigpOwogICAgfQogICAgbGFzdFRpbWUgPSBub3c7CiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7CiAgfQoKCgogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICAvLyBFdmVudCBMaXN0ZW5lciBmdW5jdGlvbnMKICAvLwogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKICBmdW5jdGlvbiByZXNpemUoKSB7CiAgICB2YXIgdyA9IHdpbmRvdy5pbm5lcldpZHRoOwogICAgdmFyIGggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7CgogICAgLy8gY2FsY3VsYXRlIHRoZSBzY2FsZSBmYWN0b3IgdG8ga2VlcCBhIGNvcnJlY3QgYXNwZWN0IHJhdGlvCiAgICB2YXIgc2NhbGVGYWN0b3IgPSBNYXRoLm1pbih3IC8gQ0FOVkFTX1dJRFRILCBoIC8gQ0FOVkFTX0hFSUdIVCk7CgogICAgaWYgKElTX0NIUk9NRSkgewogICAgICBjYW52YXMud2lkdGggPSBDQU5WQVNfV0lEVEggKiBzY2FsZUZhY3RvcjsKICAgICAgY2FudmFzLmhlaWdodCA9IENBTlZBU19IRUlHSFQgKiBzY2FsZUZhY3RvcjsKICAgICAgc2V0SW1hZ2VTbW9vdGhpbmcoZmFsc2UpOwogICAgICBjdHgudHJhbnNmb3JtKHNjYWxlRmFjdG9yLCAwLCAwLCBzY2FsZUZhY3RvciwgMCwgMCk7CiAgICB9IGVsc2UgewogICAgICAvLyByZXNpemUgdGhlIGNhbnZhcyBjc3MgcHJvcGVydGllcwogICAgICBjYW52YXMuc3R5bGUud2lkdGggPSBDQU5WQVNfV0lEVEggKiBzY2FsZUZhY3RvciArICdweCc7CiAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBDQU5WQVNfSEVJR0hUICogc2NhbGVGYWN0b3IgKyAncHgnOwogICAgfQogIH0KCiAgZnVuY3Rpb24gb25LZXlEb3duKGUpIHsKICAgIGUucHJldmVudERlZmF1bHQoKTsKICAgIGtleVN0YXRlc1tlLmtleUNvZGVdID0gdHJ1ZTsKICB9CgogIGZ1bmN0aW9uIG9uS2V5VXAoZSkgewogICAgZS5wcmV2ZW50RGVmYXVsdCgpOwogICAga2V5U3RhdGVzW2Uua2V5Q29kZV0gPSBmYWxzZTsKICB9CgoKICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjCiAgLy8gU3RhcnQgZ2FtZSEKICAvLwogIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMKCiAgaW5pdCgpOwogIGFuaW1hdGUoKTsKCn0KCg=='))();
}());
