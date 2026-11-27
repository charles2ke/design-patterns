import unittest

from prototype_snippet import Document


class DocumentCloneTest(unittest.TestCase):
    def test_overrides_are_copied_so_clones_never_share_the_template_state(self):
        template = Document("Invoice", ["finance"])

        draft = template.clone(tags=template.tags)
        draft.tags.append("draft")

        self.assertEqual(template.tags, ["finance"])
        self.assertEqual(draft.tags, ["finance", "draft"])


if __name__ == "__main__":
    unittest.main()
