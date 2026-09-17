import tiktoken


def count_tokens(text):
    """
    Estimate the number of tokens in a text.
    """

    if not text:
        return 0

    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))