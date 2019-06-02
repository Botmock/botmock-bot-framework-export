type Message = {
  next_message_ids: { message_id: string; intent: { value: string } }[];
};

export type IntentMap = Map<string, string>;

export const createIntentMap = (messages: Message[] = []): IntentMap => {
  return new Map<string, string>(
    messages.reduce(
      (acc, { next_message_ids }) => [
        ...acc,
        ...next_message_ids
          .filter(({ intent }) => intent.value)
          // Group this message with this intent and others like it (in that they
          // also are incident on this message)
          .map(message => [
            message.message_id,
            [
              message.intent.value,
              ...messages.reduce(
                (acc, { next_message_ids }) => [
                  ...acc,
                  // Must have an intent, must not be the one we already have,
                  // and must be incident on this message
                  ...next_message_ids
                    .filter(
                      ({ intent, message_id }) =>
                        intent.value &&
                        intent.value !== message.intent.value &&
                        message_id === message.message_id
                    )
                    .map(m => m.intent.value),
                ],
                []
              ),
            ],
          ]),
      ],
      []
    )
  );
};
